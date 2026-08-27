import { BackupSchema } from './types'
import type { Aluno, Frequencia, StatusFrequencia } from './types'

// ---------------------------------------------------------------------------
// Interface abstrata para suportar tanto o SQLite via Tauri quanto um
// banco em memória (fallback para desenvolvimento no navegador).
// ---------------------------------------------------------------------------
interface DatabaseBackend {
  listarAlunos(ano?: number): Promise<Aluno[]>
  criarAluno(nome: string, ano: number): Promise<void>
  atualizarAluno(id: number, nome: string, ano: number): Promise<void>
  removerAluno(id: number): Promise<void>
  listarFrequencias(ano: number, mes: number): Promise<Frequencia[]>
  alternarFrequencia(alunoId: number, data: string, status: StatusFrequencia): Promise<void>
  getConfig(key: string): Promise<string | null>
  setConfig(key: string, value: string): Promise<void>
  exportarDados(): Promise<string>
  importarDados(json: string): Promise<void>
}

// ---------------------------------------------------------------------------
// Implementação Tauri (SQLite real)
// ---------------------------------------------------------------------------
async function createTauriBackend(): Promise<DatabaseBackend> {
  const { default: Database } = await import('@tauri-apps/plugin-sql')

  const db = await Database.load('sqlite:rollcall.db')

  await db.execute(`
    CREATE TABLE IF NOT EXISTS alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ano INTEGER NOT NULL,
      nome TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS frequencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      status TEXT,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
      UNIQUE(aluno_id, data)
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  return {
    async listarAlunos(ano) {
      if (ano !== undefined) {
        return db.select<Aluno[]>('SELECT * FROM alunos WHERE ano = $1 ORDER BY nome', [ano])
      }
      return db.select<Aluno[]>('SELECT * FROM alunos ORDER BY nome')
    },
    async criarAluno(nome, ano) {
      await db.execute('INSERT INTO alunos (ano, nome) VALUES ($1, $2)', [ano, nome])
    },
    async atualizarAluno(id, nome, ano) {
      await db.execute('UPDATE alunos SET nome = $1, ano = $2 WHERE id = $3', [nome, ano, id])
    },
    async removerAluno(id) {
      await db.execute('DELETE FROM frequencias WHERE aluno_id = $1', [id])
      await db.execute('DELETE FROM alunos WHERE id = $1', [id])
    },
    async listarFrequencias(ano, mes) {
      const start = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
      const last = new Date(ano, mes + 1, 0).getDate()
      const end = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`
      return db.select<Frequencia[]>(
        'SELECT * FROM frequencias WHERE data >= $1 AND data <= $2 ORDER BY aluno_id, data',
        [start, end]
      )
    },
    async alternarFrequencia(alunoId, data, status) {
      if (status === null) {
        await db.execute('DELETE FROM frequencias WHERE aluno_id = $1 AND data = $2', [alunoId, data])
      } else {
        await db.execute(
          `INSERT INTO frequencias (aluno_id, data, status) VALUES ($1, $2, $3)
           ON CONFLICT(aluno_id, data) DO UPDATE SET status = $3`,
          [alunoId, data, status]
        )
      }
    },
    async getConfig(key) {
      const rows = await db.select<{ value: string }[]>('SELECT value FROM config WHERE key = $1', [key])
      return rows.length > 0 ? rows[0].value : null
    },
    async setConfig(key, value) {
      await db.execute(
        'INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
        [key, value]
      )
    },
    async exportarDados() {
      const alunos = await db.select<Aluno[]>('SELECT * FROM alunos ORDER BY id')
      const frequencias = await db.select<Frequencia[]>('SELECT * FROM frequencias ORDER BY aluno_id, data')
      const configRows = await db.select<{ key: string; value: string }[]>('SELECT * FROM config')
      const config: Record<string, string> = {}
      for (const r of configRows) config[r.key] = r.value
      return JSON.stringify({ alunos, frequencias, config }, null, 2)
    },
    async importarDados(json) {
      const dados = BackupSchema.parse(JSON.parse(json))
      await db.execute('BEGIN TRANSACTION')
      try {
        await db.execute('DELETE FROM frequencias')
        await db.execute('DELETE FROM alunos')
        await db.execute('DELETE FROM config')
        for (const a of dados.alunos) {
          await db.execute(
            'INSERT INTO alunos (id, ano, nome, created_at) VALUES ($1, $2, $3, $4)',
            [a.id, a.ano, a.nome, a.created_at]
          )
        }
        for (const f of dados.frequencias) {
          await db.execute(
            'INSERT INTO frequencias (id, aluno_id, data, status) VALUES ($1, $2, $3, $4)',
            [f.id, f.aluno_id, f.data, f.status]
          )
        }
        if (dados.config) {
          for (const [k, v] of Object.entries(dados.config)) {
            await db.execute(
              'INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
              [k, v]
            )
          }
        }
        await db.execute('COMMIT')
      } catch (e) {
        await db.execute('ROLLBACK')
        throw e
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Fallback em memória (desenvolvimento no navegador sem Tauri)
// ---------------------------------------------------------------------------
function createMemoryBackend(): DatabaseBackend {
  let nextAlunoId = 1
  let nextFreqId = 1
  const alunos: Aluno[] = []
  const frequencias: Frequencia[] = []
  const config: Record<string, string> = {}

  return {
    async listarAlunos(ano) {
      const filtered = ano !== undefined ? alunos.filter(a => a.ano === ano) : alunos
      return [...filtered].sort((a, b) => a.nome.localeCompare(b.nome))
    },
    async criarAluno(nome, ano) {
      alunos.push({ id: nextAlunoId++, ano, nome, created_at: new Date().toISOString() })
    },
    async atualizarAluno(id, nome, ano) {
      const a = alunos.find(x => x.id === id)
      if (!a) throw new Error('Aluno não encontrado')
      a.nome = nome
      a.ano = ano
    },
    async removerAluno(id) {
      const idx = alunos.findIndex(a => a.id === id)
      if (idx !== -1) alunos.splice(idx, 1)
      for (let i = frequencias.length - 1; i >= 0; i--) {
        if (frequencias[i].aluno_id === id) frequencias.splice(i, 1)
      }
    },
    async listarFrequencias(ano, mes) {
      const start = `${ano}-${String(mes + 1).padStart(2, '0')}-`
      return frequencias
        .filter(f => f.data.startsWith(start))
        .sort((a, b) => a.aluno_id - b.aluno_id || a.data.localeCompare(b.data))
    },
    async alternarFrequencia(alunoId, data, status) {
      const idx = frequencias.findIndex(f => f.aluno_id === alunoId && f.data === data)
      if (status === null) {
        if (idx !== -1) frequencias.splice(idx, 1)
      } else {
        if (idx !== -1) {
          frequencias[idx].status = status
        } else {
          frequencias.push({ id: nextFreqId++, aluno_id: alunoId, data, status })
        }
      }
    },
    async getConfig(key) {
      return config[key] ?? null
    },
    async setConfig(key, value) {
      config[key] = value
    },
    async exportarDados() {
      return JSON.stringify({ alunos, frequencias, config }, null, 2)
    },
    async importarDados(json) {
      const dados = BackupSchema.parse(JSON.parse(json))
      alunos.length = 0
      frequencias.length = 0
      Object.keys(config).forEach(k => delete config[k])
      for (const a of dados.alunos) {
        alunos.push(a)
        if (a.id >= nextAlunoId) nextAlunoId = a.id + 1
      }
      for (const f of dados.frequencias) {
        frequencias.push(f)
        if (f.id >= nextFreqId) nextFreqId = f.id + 1
      }
      if (dados.config) {
        for (const [k, v] of Object.entries(dados.config)) {
          config[k] = v
        }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Factory – detecta automaticamente o ambiente
// ---------------------------------------------------------------------------
let backend: DatabaseBackend | null = null
let _isTauri = false

export function isTauri(): boolean {
  return _isTauri
}

async function getBackend(): Promise<DatabaseBackend> {
  if (backend) return backend

  try {
    backend = await createTauriBackend()
    _isTauri = true
  } catch {
    backend = createMemoryBackend()
    _isTauri = false
  }
  return backend
}

// ---------------------------------------------------------------------------
// API pública (mesma assinatura de antes)
// ---------------------------------------------------------------------------
export async function listarAlunos(ano?: number): Promise<Aluno[]> {
  return (await getBackend()).listarAlunos(ano)
}

export async function criarAluno(nome: string, ano: number): Promise<void> {
  return (await getBackend()).criarAluno(nome, ano)
}

export async function atualizarAluno(id: number, nome: string, ano: number): Promise<void> {
  return (await getBackend()).atualizarAluno(id, nome, ano)
}

export async function removerAluno(id: number): Promise<void> {
  return (await getBackend()).removerAluno(id)
}

export async function listarFrequencias(ano: number, mes: number): Promise<Frequencia[]> {
  return (await getBackend()).listarFrequencias(ano, mes)
}

export async function alternarFrequencia(
  alunoId: number,
  data: string,
  status: StatusFrequencia
): Promise<void> {
  return (await getBackend()).alternarFrequencia(alunoId, data, status)
}

export async function getConfig(key: string): Promise<string | null> {
  return (await getBackend()).getConfig(key)
}

export async function setConfig(key: string, value: string): Promise<void> {
  return (await getBackend()).setConfig(key, value)
}

export async function exportarDados(): Promise<string> {
  return (await getBackend()).exportarDados()
}

export async function importarDados(json: string): Promise<void> {
  return (await getBackend()).importarDados(json)
}
