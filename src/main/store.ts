import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export default class Store {
  private data: Record<string, string>
  private path: string

  constructor() {
    const userDataPath = app.getPath('userData')
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }
    this.path = join(userDataPath, 'store.json')
    this.data = this.load()
  }

  private load(): Record<string, string> {
    try {
      if (existsSync(this.path)) {
        return JSON.parse(readFileSync(this.path, 'utf-8'))
      }
    } catch {
      // Corrupted file, start fresh
    }
    return {}
  }

  private save(): void {
    writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  get(key: string): string | null {
    return this.data[key] ?? null
  }

  set(key: string, value: string): void {
    this.data = { ...this.data, [key]: value }
    this.save()
  }

  delete(key: string): void {
    const { [key]: _, ...rest } = this.data
    this.data = rest
    this.save()
  }
}
