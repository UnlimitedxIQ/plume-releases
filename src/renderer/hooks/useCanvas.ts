import { useEffect } from 'react'
import { useCanvasStore } from '../stores/canvas-store'
import { useAppStore } from '../stores/app-store'

export function useCanvas() {
  const {
    courses,
    assignments,
    coursesLoading,
    assignmentsLoading,
    coursesError,
    assignmentsError,
    lastFetchedAt,
    fetchCourses,
    fetchAssignments,
    refreshAll,
    getAssignmentsForCourse,
    getUpcomingAssignments,
    getOverdueAssignments,
  } = useCanvasStore()

  const canvasConnected = useAppStore((s) => s.canvasConnected)

  // Auto-fetch on mount if connected and no data yet
  useEffect(() => {
    if (!canvasConnected) return
    if (courses.length === 0 && !coursesLoading) {
      fetchCourses()
    }
  }, [canvasConnected, courses.length, coursesLoading, fetchCourses])

  useEffect(() => {
    if (!canvasConnected) return
    if (courses.length > 0 && assignments.length === 0 && !assignmentsLoading) {
      fetchAssignments()
    }
  }, [canvasConnected, courses.length, assignments.length, assignmentsLoading, fetchAssignments])

  // Stale data refresh (older than 15 minutes)
  useEffect(() => {
    if (!canvasConnected) return
    if (!lastFetchedAt) return
    const stale = Date.now() - lastFetchedAt > 15 * 60 * 1000
    if (stale) refreshAll()
  }, [canvasConnected, lastFetchedAt, refreshAll])

  return {
    courses,
    assignments,
    isLoading:          coursesLoading || assignmentsLoading,
    coursesLoading,
    assignmentsLoading,
    error:              coursesError ?? assignmentsError,
    lastFetchedAt,
    fetchCourses,
    fetchAssignments,
    refreshAll,
    getAssignmentsForCourse,
    getUpcomingAssignments,
    getOverdueAssignments,
    isConnected:        canvasConnected,
  }
}
