import { useState, useEffect } from 'react'
import { ipc } from '../lib/ipc'
import type { Skill } from '../types/skill'
import type { SkillDef } from '../lib/ipc'
import type { ProjectTypeId } from '../lib/constants'

function mapSkillDef(def: SkillDef): Skill {
  return {
    id:           def.id,
    name:         def.name,
    description:  def.description,
    icon:         def.icon ?? '🔧',
    projectTypes: def.projectTypes as ProjectTypeId[],
    toolCount:    def.toolCount,
    isBuiltIn:    true,
  }
}

export function useSkills(projectType?: ProjectTypeId) {
  const [skills,    setSkills]    = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const raw = projectType
          ? await ipc.getSkillsForProject(projectType)
          : await ipc.getAllSkills()
        setSkills(raw.map(mapSkillDef))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load skills')
        // Fallback: empty list (skills section still renders)
        setSkills([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [projectType])

  return { skills, isLoading, error }
}

export function useTabSkills(tabId: string, projectType: ProjectTypeId) {
  const { skills, isLoading, error } = useSkills(projectType)

  return { skills, isLoading, error }
}
