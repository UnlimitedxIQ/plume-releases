const BASE_URL = 'https://uoregon.instructure.com/api/v1'

interface CanvasCourse {
  id: number
  name: string
  course_code: string
  enrollment_term_id: number
  start_at: string | null
  end_at: string | null
}

interface CanvasAssignment {
  id: number
  name: string
  description: string | null
  due_at: string | null
  points_possible: number
  course_id: number
  course_name?: string
  html_url: string
  submission_types: string[]
  has_submitted_submissions: boolean
  rubric?: CanvasRubricCriterion[]
}

interface CanvasRubricCriterion {
  id: string
  description: string
  long_description: string
  points: number
  ratings: Array<{
    id: string
    description: string
    long_description: string
    points: number
  }>
}

interface CanvasModule {
  id: number
  name: string
  position: number
  items_count: number
  items_url: string
}

export class CanvasClient {
  private token: string
  private headers: Record<string, string>

  constructor(token: string) {
    this.token = token
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }
    const response = await fetch(url.toString(), { headers: this.headers })
    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<T>
  }

  private async fetchWithArrayParams<T>(endpoint: string, params?: Record<string, string | string[]>): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((val) => url.searchParams.append(k, val))
        } else {
          url.searchParams.set(k, v)
        }
      })
    }
    const response = await fetch(url.toString(), { headers: this.headers })
    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<T>
  }

  private async put<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `${BASE_URL}${endpoint}`
    const response = await fetch(url, {
      method:  'PUT',
      headers: this.headers,
      body:    JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<T>
  }

  async testConnection(): Promise<{ success: boolean; user?: string; error?: string }> {
    try {
      const user = await this.fetch<{ name: string }>('/users/self')
      return { success: true, user: user.name }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Connection failed'
      return { success: false, error: msg }
    }
  }

  async getCourses(): Promise<CanvasCourse[]> {
    return this.fetch<CanvasCourse[]>('/courses', {
      enrollment_state: 'active',
      per_page: '50'
    })
  }

  async getCourseInstructors(courseId: number): Promise<CanvasInstructor[]> {
    try {
      const enrollments = await this.fetch<Array<{
        user_id: number
        user: { id: number; name: string; short_name: string }
        type: string
        role: string
      }>>(`/courses/${courseId}/enrollments`, {
        type: 'TeacherEnrollment',
        per_page: '10',
      })

      return enrollments.map(e => ({
        id: e.user?.id ?? e.user_id,
        name: e.user?.name ?? 'Instructor',
        shortName: e.user?.short_name ?? 'Instructor',
      }))
    } catch {
      return []
    }
  }

  async getCourseAssignments(courseId: number): Promise<MappedAssignment[]> {
    const raw = await this.fetch<CanvasAssignment[]>(
      `/courses/${courseId}/assignments`,
      { per_page: '50', order_by: 'due_at' }
    )
    return raw.map(a => mapAssignment(a, courseId))
  }

  async getUpcomingAssignments(days: number = 14): Promise<MappedAssignment[]> {
    const courses = await this.getCourses()
    const now = new Date()
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const allAssignments: MappedAssignment[] = []

    for (const course of courses) {
      try {
        const assignments = await this.getCourseAssignments(course.id)
        const upcoming = assignments.filter(a => {
          if (!a.dueAt) return false
          const due = new Date(a.dueAt)
          return due >= now && due <= cutoff
        })
        allAssignments.push(...upcoming)
      } catch {
        // Skip courses that fail
      }
    }

    return allAssignments.sort((a, b) => {
      if (!a.dueAt || !b.dueAt) return 0
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    })
  }

  async getAssignmentRubric(courseId: number, assignmentId: number): Promise<CanvasRubricCriterion[] | null> {
    try {
      const assignment = await this.fetch<CanvasAssignment>(
        `/courses/${courseId}/assignments/${assignmentId}`,
        { include: 'rubric' }
      )
      return assignment.rubric ?? null
    } catch {
      return null
    }
  }

  async getCourseModules(courseId: number): Promise<CanvasModule[]> {
    return this.fetch<CanvasModule[]>(`/courses/${courseId}/modules`, { per_page: '50' })
  }

  async getAnnouncements(courseIds?: number[]): Promise<CanvasAnnouncement[]> {
    const courses = courseIds ?? (await this.getCourses()).map(c => c.id)
    const allAnnouncements: CanvasAnnouncement[] = []

    for (const courseId of courses) {
      try {
        const announcements = await this.fetch<CanvasAnnouncement[]>(
          `/courses/${courseId}/discussion_topics`,
          { only_announcements: 'true', per_page: '10', order_by: 'recent_activity' }
        )
        allAnnouncements.push(...announcements.map(a => ({ ...a, course_id: courseId })))
      } catch {
        // Skip courses that fail
      }
    }

    return allAnnouncements.sort((a, b) => {
      return new Date(b.posted_at || b.created_at).getTime() - new Date(a.posted_at || a.created_at).getTime()
    })
  }

  // ── Submissions & Grading (Teacher Mode) ─────────────────────────────

  async getSubmissions(courseId: number, assignmentId: number): Promise<CanvasSubmission[]> {
    return this.fetchWithArrayParams<CanvasSubmission[]>(
      `/courses/${courseId}/assignments/${assignmentId}/submissions`,
      {
        'include[]':  ['submission_comments', 'rubric_assessment', 'user'],
        per_page:     '100',
      }
    )
  }

  async getSubmissionContent(courseId: number, assignmentId: number, userId: number): Promise<CanvasSubmission> {
    return this.fetchWithArrayParams<CanvasSubmission>(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`,
      {
        'include[]': ['submission_comments', 'rubric_assessment'],
      }
    )
  }

  async updateGrade(
    courseId: number,
    assignmentId: number,
    studentId: number,
    payload: { score: number; rubricAssessment?: Record<string, { points: number }>; comment?: string }
  ): Promise<CanvasSubmission> {
    const body: Record<string, unknown> = {
      submission: { posted_grade: payload.score },
    }
    if (payload.rubricAssessment) {
      body.rubric_assessment = payload.rubricAssessment
    }
    if (payload.comment) {
      body.comment = { text_comment: payload.comment }
    }
    return this.put<CanvasSubmission>(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`,
      body
    )
  }

  async bulkUpdateGrades(
    courseId: number,
    assignmentId: number,
    payloads: Array<{ studentId: number; score: number; rubricAssessment?: Record<string, { points: number }>; comment?: string }>
  ): Promise<{ succeeded: number; failed: number; errors: Array<{ studentId: number; error: string }> }> {
    const CONCURRENCY = 3
    let succeeded = 0
    const errors: Array<{ studentId: number; error: string }> = []

    for (let i = 0; i < payloads.length; i += CONCURRENCY) {
      const batch = payloads.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map((p) => this.updateGrade(courseId, assignmentId, p.studentId, p))
      )
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          succeeded++
        } else {
          errors.push({ studentId: batch[idx].studentId, error: r.reason?.message ?? 'Unknown error' })
        }
      })
    }

    return { succeeded, failed: errors.length, errors }
  }

  async checkIsInstructor(): Promise<boolean> {
    try {
      const enrollments = await this.fetch<Array<{ type: string; role: string }>>(
        '/users/self/enrollments',
        { per_page: '100', state: 'active' }
      )
      return enrollments.some(
        (e) => e.type === 'TeacherEnrollment' || e.type === 'TaEnrollment'
      )
    } catch {
      return false
    }
  }

  async sendMessage(recipientIds: string[], subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${BASE_URL}/conversations`
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          recipients: recipientIds,
          subject,
          body,
          force_new: true
        })
      })
      if (!response.ok) {
        return { success: false, error: `Failed: ${response.status} ${response.statusText}` }
      }
      return { success: true }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Send failed'
      return { success: false, error: msg }
    }
  }
}

interface CanvasAnnouncement {
  id: number
  title: string
  message: string
  posted_at: string
  created_at: string
  course_id: number
  author: {
    display_name: string
    avatar_image_url?: string
  }
  html_url: string
}

// Maps snake_case Canvas API response to camelCase for the renderer
interface MappedAssignment {
  id: number
  name: string
  description: string | null
  dueAt: string | null
  pointsPossible: number
  courseId: number
  courseName?: string
  htmlUrl: string
  submissionTypes: string[]
  hasRubric: boolean
}

function mapAssignment(a: CanvasAssignment, courseId: number): MappedAssignment {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    dueAt: a.due_at,
    pointsPossible: a.points_possible,
    courseId: a.course_id ?? courseId,
    htmlUrl: a.html_url,
    submissionTypes: a.submission_types,
    hasRubric: !!a.rubric,
  }
}

interface CanvasInstructor {
  id: number
  name: string
  shortName: string
}

interface CanvasSubmission {
  id: number
  user_id: number
  assignment_id: number
  body: string | null
  url: string | null
  submitted_at: string | null
  score: number | null
  grade: string | null
  workflow_state: 'submitted' | 'graded' | 'pending_review' | 'unsubmitted'
  late: boolean
  missing: boolean
  attempt: number | null
  attachments?: Array<{ id: number; display_name: string; url: string; filename: string; 'content-type': string }>
  submission_comments?: Array<{ id: number; author_name: string; comment: string; created_at: string }>
  rubric_assessment?: Record<string, { points: number; comments?: string; rating_id?: string }>
  user?: { id: number; name: string; short_name: string }
}

export type { CanvasCourse, CanvasAssignment, CanvasRubricCriterion, CanvasModule, CanvasAnnouncement, MappedAssignment, CanvasInstructor, CanvasSubmission }
