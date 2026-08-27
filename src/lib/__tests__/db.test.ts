import { describe, it, expect, beforeEach } from 'vitest'
import {
  listarAlunos,
  criarAluno,
  atualizarAluno,
  removerAluno,
  listarFrequencias,
  alternarFrequencia,
  exportarDados,
  importarDados,
} from '../db'

describe('Alunos CRUD', () => {
  beforeEach(async () => {
    const data = await listarAlunos()
    for (const a of data) {
      await removerAluno(a.id)
    }
  })

  it('starts empty', async () => {
    expect(await listarAlunos()).toEqual([])
  })

  it('cria e lista alunos', async () => {
    await criarAluno('João Silva', 2024)
    await criarAluno('Maria Souza', 2024)
    const alunos = await listarAlunos()
    expect(alunos).toHaveLength(2)
    expect(alunos[0].nome).toBe('João Silva')
    expect(alunos[1].nome).toBe('Maria Souza')
  })

  it('filtra alunos por ano', async () => {
    await criarAluno('João', 2024)
    await criarAluno('Maria', 2025)
    expect(await listarAlunos(2024)).toHaveLength(1)
    expect(await listarAlunos(2025)).toHaveLength(1)
    expect(await listarAlunos(2026)).toHaveLength(0)
  })

  it('atualiza aluno', async () => {
    await criarAluno('João', 2024)
    const alunos = await listarAlunos()
    await atualizarAluno(alunos[0].id, 'João Silva Atualizado', 2025)
    const updated = await listarAlunos()
    expect(updated[0].nome).toBe('João Silva Atualizado')
    expect(updated[0].ano).toBe(2025)
  })

  it('remove aluno', async () => {
    await criarAluno('João', 2024)
    await criarAluno('Maria', 2024)
    const alunos = await listarAlunos()
    await removerAluno(alunos[0].id)
    expect(await listarAlunos()).toHaveLength(1)
  })
})

describe('Frequencias CRUD', () => {
  let alunoId: number

  beforeEach(async () => {
    const data = await listarAlunos()
    for (const a of data) {
      await removerAluno(a.id)
    }
    await criarAluno('João', 2024)
    const alunos = await listarAlunos()
    alunoId = alunos[0].id
  })

  it('marca falta (X)', async () => {
    await alternarFrequencia(alunoId, '2024-03-15', 'falta')
    const freqs = await listarFrequencias(2024, 2)
    expect(freqs).toHaveLength(1)
    expect(freqs[0].status).toBe('falta')
    expect(freqs[0].aluno_id).toBe(alunoId)
  })

  it('marca atestado (A)', async () => {
    await alternarFrequencia(alunoId, '2024-03-15', 'atestado')
    const freqs = await listarFrequencias(2024, 2)
    expect(freqs[0].status).toBe('atestado')
  })

  it('alterna de falta para atestado', async () => {
    await alternarFrequencia(alunoId, '2024-03-15', 'falta')
    await alternarFrequencia(alunoId, '2024-03-15', 'atestado')
    const freqs = await listarFrequencias(2024, 2)
    expect(freqs[0].status).toBe('atestado')
  })

  it('limpa marcação', async () => {
    await alternarFrequencia(alunoId, '2024-03-15', 'falta')
    await alternarFrequencia(alunoId, '2024-03-15', null)
    const freqs = await listarFrequencias(2024, 2)
    expect(freqs).toHaveLength(0)
  })

  it('lista apenas frequencias do mês correto', async () => {
    await alternarFrequencia(alunoId, '2024-03-15', 'falta')
    await alternarFrequencia(alunoId, '2024-04-01', 'atestado')

    const mar = await listarFrequencias(2024, 2)
    expect(mar).toHaveLength(1)
    expect(mar[0].data).toBe('2024-03-15')

    const abr = await listarFrequencias(2024, 3)
    expect(abr).toHaveLength(1)
    expect(abr[0].data).toBe('2024-04-01')
  })

  it('remove frequencias ao remover aluno', async () => {
    await alternarFrequencia(alunoId, '2024-03-15', 'falta')
    await removerAluno(alunoId)
    const freqs = await listarFrequencias(2024, 2)
    expect(freqs).toHaveLength(0)
  })
})

describe('Export / Import', () => {
  beforeEach(async () => {
    const data = await listarAlunos()
    for (const a of data) {
      await removerAluno(a.id)
    }
  })

  it('exporta e importa dados completos', async () => {
    await criarAluno('João', 2024)
    await criarAluno('Maria', 2024)
    const alunos = await listarAlunos()
    await alternarFrequencia(alunos[0].id, '2024-03-15', 'falta')
    await alternarFrequencia(alunos[1].id, '2024-03-16', 'atestado')

    const json = await exportarDados()

    await removerAluno(alunos[0].id)
    await removerAluno(alunos[1].id)
    expect(await listarAlunos()).toHaveLength(0)

    await importarDados(json)
    expect(await listarAlunos()).toHaveLength(2)
    const freqs = await listarFrequencias(2024, 2)
    expect(freqs).toHaveLength(2)
  })

  it('rejeita JSON inválido', async () => {
    await expect(importarDados('{"invalido": true}')).rejects.toThrow()
  })

  it('rejeita JSON sem alunos', async () => {
    await expect(importarDados('{"alunos": [], "frequencias": []}')).resolves.not.toThrow()
  })
})
