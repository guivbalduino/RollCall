import { describe, it, expect } from 'vitest'
import { AlunoSchema, FrequenciaSchema, BackupSchema } from '../types'

describe('AlunoSchema', () => {
  it('accepts valid aluno', () => {
    const aluno = { id: 1, ano: 2026, nome: 'João', created_at: '2024-01-01' }
    expect(AlunoSchema.parse(aluno)).toEqual(aluno)
  })

  it('rejects empty nome', () => {
    expect(() => AlunoSchema.parse({ id: 1, ano: 2026, nome: '', created_at: '' }))
      .toThrow()
  })

  it('rejects non-number id', () => {
    expect(() => AlunoSchema.parse({ id: 'abc', ano: 2026, nome: 'João', created_at: '' }))
      .toThrow()
  })
})

describe('FrequenciaSchema', () => {
  it('accepts valid falta', () => {
    const f = { id: 1, aluno_id: 1, data: '2024-03-15', status: 'falta' }
    expect(FrequenciaSchema.parse(f)).toEqual(f)
  })

  it('accepts valid atestado', () => {
    const f = { id: 1, aluno_id: 1, data: '2024-03-15', status: 'atestado' }
    expect(FrequenciaSchema.parse(f)).toEqual(f)
  })

  it('accepts null status', () => {
    const f = { id: 1, aluno_id: 1, data: '2024-03-15', status: null }
    expect(FrequenciaSchema.parse(f)).toEqual(f)
  })

  it('rejects invalid status', () => {
    expect(() => FrequenciaSchema.parse({ id: 1, aluno_id: 1, data: '2024-03-15', status: 'presente' }))
      .toThrow()
  })

  it('rejects bad date format', () => {
    expect(() => FrequenciaSchema.parse({ id: 1, aluno_id: 1, data: '15/03/2024', status: null }))
      .toThrow()
  })
})

describe('BackupSchema', () => {
  it('accepts valid backup', () => {
    const backup = {
      alunos: [{ id: 1, ano: 2026, nome: 'João', created_at: '2024-01-01' }],
      frequencias: [{ id: 1, aluno_id: 1, data: '2024-03-15', status: 'falta' }],
      config: {},
    }
    expect(BackupSchema.parse(backup)).toEqual(backup)
  })

  it('rejects backup without alunos', () => {
    expect(() => BackupSchema.parse({ frequencias: [] })).toThrow()
  })

  it('rejects backup without frequencias', () => {
    expect(() => BackupSchema.parse({ alunos: [] })).toThrow()
  })
})
