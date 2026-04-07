import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'

/**
 * Local encrypted vault for secrets, API keys, and sensitive data.
 * Backed by SQLite in the app's userData directory.
 * Values encrypted via Electron's safeStorage (OS-level keychain).
 */

interface VaultEntry {
  key: string
  value: string       // stored encrypted, decrypted on read
  label: string       // human-readable name
  category: string    // 'api_key' | 'token' | 'secret' | 'credential' | 'note'
  createdAt: number
  updatedAt: number
}

export class Vault {
  private db: Database.Database

  constructor() {
    const vaultDir = join(app.getPath('userData'), 'vault')
    if (!existsSync(vaultDir)) {
      mkdirSync(vaultDir, { recursive: true })
    }

    const dbPath = join(vaultDir, 'vault.db')
    const jsonPath = join(vaultDir, 'vault.json')

    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')

    // Create table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        key       TEXT PRIMARY KEY,
        value     TEXT NOT NULL,
        label     TEXT NOT NULL,
        category  TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `)

    // Migrate from JSON if it exists and DB is empty
    const count = this.db.prepare('SELECT COUNT(*) as c FROM entries').get() as { c: number }
    if (count.c === 0 && existsSync(jsonPath)) {
      this.migrateFromJson(jsonPath)
    }
  }

  private migrateFromJson(jsonPath: string): void {
    try {
      const raw = readFileSync(jsonPath, 'utf-8')
      const data = JSON.parse(raw) as { entries?: VaultEntry[] }
      if (data.entries && data.entries.length > 0) {
        const insert = this.db.prepare(
          'INSERT OR IGNORE INTO entries (key, value, label, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
        )
        const tx = this.db.transaction((entries: VaultEntry[]) => {
          for (const e of entries) {
            insert.run(e.key, e.value, e.label, e.category, e.createdAt, e.updatedAt)
          }
        })
        tx(data.entries)
      }
    } catch {
      // Migration failed — start fresh
    }
  }

  private encrypt(value: string): string {
    return safeStorage.encryptString(value).toString('base64')
  }

  private decrypt(encrypted: string): string {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
  }

  // Get all entries (values are decrypted)
  getAll(): Array<Omit<VaultEntry, 'value'> & { value: string }> {
    const rows = this.db.prepare('SELECT * FROM entries ORDER BY updatedAt DESC').all() as VaultEntry[]
    return rows.map(e => ({ ...e, value: this.decrypt(e.value) }))
  }

  // Get all entries with masked values (for UI display)
  getAllMasked(): Array<Omit<VaultEntry, 'value'> & { maskedValue: string }> {
    const rows = this.db.prepare('SELECT * FROM entries ORDER BY updatedAt DESC').all() as VaultEntry[]
    return rows.map(e => {
      const decrypted = this.decrypt(e.value)
      const masked = decrypted.length > 8
        ? decrypted.slice(0, 4) + '\u2022'.repeat(Math.min(decrypted.length - 8, 20)) + decrypted.slice(-4)
        : '\u2022'.repeat(decrypted.length)
      return { ...e, maskedValue: masked }
    })
  }

  // Get a single entry by key (decrypted)
  get(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM entries WHERE key = ?').get(key) as { value: string } | undefined
    if (!row) return null
    return this.decrypt(row.value)
  }

  // Set (create or update) an entry
  set(key: string, value: string, label: string, category: string): void {
    const now = Date.now()
    this.db.prepare(`
      INSERT INTO entries (key, value, label, category, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        label = excluded.label,
        category = excluded.category,
        updatedAt = excluded.updatedAt
    `).run(key, this.encrypt(value), label, category, now, now)
  }

  // Delete an entry
  delete(key: string): void {
    this.db.prepare('DELETE FROM entries WHERE key = ?').run(key)
  }

  // List vault keys (names only, no values) for the system prompt
  listKeys(): Array<{ key: string; label: string; category: string }> {
    return this.db.prepare('SELECT key, label, category FROM entries ORDER BY key').all() as Array<{ key: string; label: string; category: string }>
  }

  // System prompt snippet — tells Claude the vault exists and how to use it
  toSystemPromptContext(): string {
    const keys = this.listKeys()

    const baseInstructions = `
## Plume Vault
You are running inside Plume, a self-contained desktop app. ALL credentials, API keys, and tokens you need must come from Plume's local vault — NOT from your own subscription or external config.

**Rules:**
- ALWAYS check the vault first (vault_list, vault_lookup) before asking the user for any credential.
- If a credential is missing, ask the user for it in chat. When they provide it, use vault_save to store it immediately.
- If a task requires a credential not in the vault, explain what's needed, where to get it, and help the user find it.
- NEVER assume you have access to credentials outside this vault.`

    if (keys.length === 0) {
      return `${baseInstructions}\n\nThe vault is currently empty. If you need an API key, token, or credential, ask the user and save it with vault_save.\n`
    }

    const lines = keys.map(k => `- "${k.key}" (${k.label}) [${k.category}]`)
    return `${baseInstructions}\n\nCurrent vault entries:\n${lines.join('\n')}\n\nUse vault_lookup to retrieve values. Use vault_save to store new ones.\n`
  }

  // Close the database connection
  close(): void {
    this.db.close()
  }
}
