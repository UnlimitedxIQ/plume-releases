import { readFile as fsReadFile, writeFile as fsWriteFile, readdir, stat, mkdir } from 'fs/promises'
import { join, resolve } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { getSkillsForProject } from './skills/skill-loader'
import { Vault } from './vault'

const execAsync = promisify(exec)

interface ToolDefinition {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

// Core file tools
const fileTools: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at the given path.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the file to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file at the given path. Creates the file if it does not exist.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the file to write' },
        content: { type: 'string', description: 'Content to write to the file' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'List files and directories at the given path.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the directory to list' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Search for files matching a pattern in the given directory.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern to match (e.g., "*.ts", "**/*.py")' },
        directory: { type: 'string', description: 'Directory to search in' }
      },
      required: ['pattern', 'directory']
    }
  }
]

// Shell tools
const shellTools: ToolDefinition[] = [
  {
    name: 'execute_command',
    description: 'Execute a shell command and return its output. Use for running scripts, builds, tests, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to execute' },
        cwd: { type: 'string', description: 'Working directory for the command (optional)' }
      },
      required: ['command']
    }
  }
]

// Vault tools
const vaultTools: ToolDefinition[] = [
  {
    name: 'vault_lookup',
    description: 'Look up a secret from the user\'s local vault by key name. Use this to retrieve API keys, tokens, and credentials instead of asking the user to paste them.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'The vault key to look up (e.g. "openai-key", "canvas-token")' }
      },
      required: ['key']
    }
  },
  {
    name: 'vault_list',
    description: 'List all available keys in the user\'s vault (names only, not values). Use to check what secrets are available before asking the user.',
    input_schema: {
      type: 'object',
      properties: {},
    }
  },
  {
    name: 'vault_save',
    description: 'Save a secret to the user\'s local vault. Use this when the user shares an API key, token, or credential in chat so it\'s stored securely for future use. Always confirm with the user before saving.',
    input_schema: {
      type: 'object',
      properties: {
        key:      { type: 'string', description: 'Unique key name (e.g. "openai-key", "github-token")' },
        value:    { type: 'string', description: 'The secret value to store' },
        label:    { type: 'string', description: 'Human-readable label (e.g. "OpenAI API Key")' },
        category: { type: 'string', enum: ['api_key', 'token', 'secret', 'credential', 'note'], description: 'Category of the secret' }
      },
      required: ['key', 'value', 'label', 'category']
    }
  }
]

// Blocked commands for safety
const BLOCKED_COMMANDS = [
  'rm -rf /',
  'format',
  'del /s /q',
  'shutdown',
  'reboot'
]

export function getToolsForProject(projectType: string, enabledSkillIds: string[]): ToolDefinition[] {
  const tools = [...fileTools, ...shellTools, ...vaultTools]

  // Add skill-specific tools
  const skills = getSkillsForProject(projectType)
  for (const skill of skills) {
    if (enabledSkillIds.includes(skill.id)) {
      tools.push(...skill.tools)
    }
  }

  return tools
}

export function getAllTools(): ToolDefinition[] {
  return [...fileTools, ...shellTools]
}

export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'read_file': {
      const path = input.path as string
      if (!path) throw new Error('Missing required parameter: path')
      return fsReadFile(resolve(path), 'utf-8')
    }

    case 'write_file': {
      const path = resolve(input.path as string)
      const content = input.content as string
      if (!path || content === undefined) throw new Error('Missing required parameters: path, content')
      const dir = join(path, '..')
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
      }
      await fsWriteFile(path, content, 'utf-8')
      return `File written successfully: ${path}`
    }

    case 'list_directory': {
      const dirPath = resolve(input.path as string)
      const entries = await readdir(dirPath, { withFileTypes: true })
      const items = await Promise.all(entries.map(async (e) => {
        const fullPath = join(dirPath, e.name)
        const s = await stat(fullPath)
        return {
          name: e.name,
          type: e.isDirectory() ? 'directory' : 'file',
          size: s.size,
          modified: s.mtime.toISOString()
        }
      }))
      return JSON.stringify(items, null, 2)
    }

    case 'search_files': {
      const pattern = input.pattern as string
      const directory = resolve(input.directory as string)
      try {
        const { stdout } = await execAsync(
          `find "${directory}" -name "${pattern}" -type f 2>/dev/null | head -50`,
          { timeout: 10000 }
        )
        return stdout || 'No files found'
      } catch {
        return 'Search failed or no results'
      }
    }

    case 'execute_command': {
      const command = input.command as string
      const cwd = input.cwd as string | undefined
      if (!command) throw new Error('Missing required parameter: command')

      if (BLOCKED_COMMANDS.some(blocked => command.toLowerCase().includes(blocked))) {
        throw new Error('Command blocked for safety')
      }

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: cwd ? resolve(cwd) : undefined,
          timeout: 30000,
          maxBuffer: 1024 * 1024
        })
        return stdout + (stderr ? `\nSTDERR:\n${stderr}` : '')
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'stdout' in error) {
          const e = error as { stdout: string; stderr: string }
          return `Command failed:\n${e.stdout}\n${e.stderr}`
        }
        throw error
      }
    }

    case 'vault_lookup': {
      const key = input.key as string
      if (!key) throw new Error('Missing required parameter: key')
      let vaultInstance: Vault
      try {
        vaultInstance = new Vault()
      } catch {
        throw new Error('Vault not available')
      }
      const value = vaultInstance.get(key)
      if (value === null) {
        return `No vault entry found for key "${key}". Ask the user to add it to their vault.`
      }
      return value
    }

    case 'vault_list': {
      let vaultInstance: Vault
      try {
        vaultInstance = new Vault()
      } catch {
        return 'Vault not available'
      }
      const keys = vaultInstance.listKeys()
      if (keys.length === 0) {
        return 'The vault is empty. No secrets stored yet.'
      }
      return keys.map(k => `- ${k.key}: ${k.label} (${k.category})`).join('\n')
    }

    case 'vault_save': {
      const { key, value, label, category } = input as { key: string; value: string; label: string; category: string }
      if (!key || !value || !label || !category) {
        throw new Error('Missing required parameters: key, value, label, category')
      }
      let vaultInstance: Vault
      try {
        vaultInstance = new Vault()
      } catch {
        throw new Error('Vault not available')
      }
      vaultInstance.set(key, value, label, category)
      return `Saved "${label}" to vault under key "${key}". The credential is now available for future sessions.`
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
