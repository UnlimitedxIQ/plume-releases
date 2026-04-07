import { create } from 'zustand'
import type { CanvasCourse, CanvasAssignment } from '../types/canvas'
import { ipc } from '../lib/ipc'

interface CanvasState {
  // ── Data ──────────────────────────────────────────────────────────────
  courses:     CanvasCourse[]
  assignments: CanvasAssignment[]

  // ── Loading ───────────────────────────────────────────────────────────
  coursesLoading:     boolean
  assignmentsLoading: boolean

  // ── Error ─────────────────────────────────────────────────────────────
  coursesError:     string | null
  assignmentsError: string | null

  // ── Last Fetched ──────────────────────────────────────────────────────
  lastFetchedAt: number | null

  // ── Actions ───────────────────────────────────────────────────────────
  fetchCourses:     () => Promise<void>
  fetchAssignments: (courseId?: number) => Promise<void>
  refreshAll:       () => Promise<void>
  clearData:        () => void

  // ── Selectors ─────────────────────────────────────────────────────────
  getAssignmentsForCourse: (courseId: number) => CanvasAssignment[]
  getUpcomingAssignments:  (days?: number) => CanvasAssignment[]
  getOverdueAssignments:   () => CanvasAssignment[]
}

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  courses:            [],
  assignments:        [],
  coursesLoading:     false,
  assignmentsLoading: false,
  coursesError:       null,
  assignmentsError:   null,
  lastFetchedAt:      null,

  fetchCourses: async () => {
    set({ coursesLoading: true, coursesError: null })
    try {
      const courses = await ipc.getCanvasCourses()
      // Map from IPC types to our renderer types
      const mapped: CanvasCourse[] = courses.map((c) => ({
        id:         c.id,
        name:       c.name,
        courseCode: c.code,
      }))
      set({ courses: mapped, coursesLoading: false, lastFetchedAt: Date.now() })
    } catch (err) {
      set({
        coursesLoading: false,
        coursesError: err instanceof Error ? err.message : 'Failed to load courses',
      })
    }
  },

  fetchAssignments: async (courseId) => {
    set({ assignmentsLoading: true, assignmentsError: null })
    try {
      const raw = await ipc.getCanvasAssignments(courseId)
      // Merge with existing assignments if filtering by course
      set((s) => {
        const incoming: CanvasAssignment[] = raw.map((a) => ({
          id:              a.id,
          courseId:        a.courseId,
          name:            a.name,
          description:     a.description,
          dueAt:           a.dueAt,
          lockAt:          null,
          pointsPossible:  a.pointsPossible,
          submissionTypes: a.submissionTypes as CanvasAssignment['submissionTypes'],
          htmlUrl:         a.htmlUrl,
          hasRubric:       a.hasRubric,
          isPublished:     true,
          allowedAttempts: null,
        }))

        const merged = courseId
          ? [...s.assignments.filter((a) => a.courseId !== courseId), ...incoming]
          : incoming

        // Deduplicate by assignment ID
        const seen = new Set<number>()
        const assignments = merged.filter(a => {
          if (seen.has(a.id)) return false
          seen.add(a.id)
          return true
        })

        return { assignments, assignmentsLoading: false }
      })
    } catch (err) {
      set({
        assignmentsLoading: false,
        assignmentsError: err instanceof Error ? err.message : 'Failed to load assignments',
      })
    }
  },

  refreshAll: async () => {
    await get().fetchCourses()
    await get().fetchAssignments()
  },

  clearData: () => {
    set({
      courses:            [],
      assignments:        [],
      coursesError:       null,
      assignmentsError:   null,
      lastFetchedAt:      null,
    })
  },

  // ── Selectors ───────────────────────────────────────────────────────
  getAssignmentsForCourse: (courseId) => {
    return get().assignments.filter((a) => a.courseId === courseId)
  },

  getUpcomingAssignments: (days = 14) => {
    const cutoff = Date.now() + days * 24 * 60 * 60 * 1000
    return get()
      .assignments
      .filter((a) => {
        if (!a.dueAt) return false
        const due = new Date(a.dueAt).getTime()
        return due >= Date.now() && due <= cutoff
      })
      .sort((a, b) =>
        new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()
      )
  },

  getOverdueAssignments: () => {
    return get()
      .assignments
      .filter((a) => {
        if (!a.dueAt) return false
        return (
          new Date(a.dueAt).getTime() < Date.now() &&
          a.submissionStatus !== 'submitted' &&
          a.submissionStatus !== 'graded'
        )
      })
      .sort((a, b) =>
        new Date(b.dueAt!).getTime() - new Date(a.dueAt!).getTime()
      )
  },
}))
