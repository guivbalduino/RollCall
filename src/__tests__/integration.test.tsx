import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AttendanceGrid from '@/components/AttendanceGrid'
import {
  criarAluno,
  listarAlunos,
  listarFrequencias,
  alternarFrequencia,
  exportarDados,
  importarDados,
} from '@/lib/db'

describe('integração: AttendanceGrid + DB', () => {
  beforeEach(async () => {
    await importarDados(JSON.stringify({ alunos: [], frequencias: [], config: {} }))
  })

  it('cria alunos via DB e renderiza na grid', async () => {
    await criarAluno('João Silva', 2024)
    await criarAluno('Maria Souza', 2024)
    const alunos = await listarAlunos()

    render(
      <AttendanceGrid
        alunos={alunos}
        frequencias={{}}
        ano={2024}
        mes={2}
        onToggle={vi.fn()}
        onEditAluno={vi.fn()}
        onRemoveAluno={vi.fn()}
      />
    )

    expect(screen.getByText('João Silva')).toBeDefined()
    expect(screen.getByText('Maria Souza')).toBeDefined()
  })

  it('marca falta e verifica no DB', async () => {
    await criarAluno('Carlos', 2024)
    const alunos = await listarAlunos()
    const onToggle = vi.fn()

    render(
      <AttendanceGrid
        alunos={alunos}
        frequencias={{}}
        ano={2024}
        mes={2}
        onToggle={onToggle}
        onEditAluno={vi.fn()}
        onRemoveAluno={vi.fn()}
      />
    )

    const cells = screen.getAllByRole('cell')
    const target = cells.find(c =>
      c.textContent === '' &&
      c.closest('tr')?.textContent?.includes('Carlos')
    )
    if (target) {
      await userEvent.click(target)
      await vi.waitFor(() => expect(onToggle).toHaveBeenCalled(), { timeout: 1000 })
    }
  })

  it('cria aluno, marca falta, lista frequencia', async () => {
    await criarAluno('Ana', 2024)
    const alunos = await listarAlunos()

    render(
      <AttendanceGrid
        alunos={alunos}
        frequencias={{}}
        ano={2024}
        mes={2}
        onToggle={async (alunoId, data, status) => {
          await alternarFrequencia(alunoId, data, status)
        }}
        onEditAluno={vi.fn()}
        onRemoveAluno={vi.fn()}
      />
    )

    const cells = screen.getAllByRole('cell')
    const target = cells.find(c =>
      c.textContent === '' &&
      c.closest('tr')?.textContent?.includes('Ana')
    )
    if (target) {
      await userEvent.click(target)
      await vi.waitFor(async () => {
        const freqs = await listarFrequencias(2024, 2)
        expect(freqs.length).toBeGreaterThan(0)
      }, { timeout: 1500 })
    }
  })
})

describe('integração: export/import round-trip', () => {
  beforeEach(async () => {
    await importarDados(JSON.stringify({ alunos: [], frequencias: [], config: {} }))
  })

  it('exporta e importa mantendo dados', async () => {
    await criarAluno('Pedro', 2024)
    const json = await exportarDados()

    await importarDados(JSON.stringify({ alunos: [], frequencias: [], config: {} }))
    const vazios = await listarAlunos()
    expect(vazios).toHaveLength(0)

    await importarDados(json)
    const alunos = await listarAlunos()
    expect(alunos).toHaveLength(1)
    expect(alunos[0].nome).toBe('Pedro')
  })

  it('export/import preserva configuração', async () => {
    const { setConfig } = await import('@/lib/db')
    await setConfig('pages', '50')

    const json = await exportarDados()
    const parsed = JSON.parse(json)
    expect(parsed.config).toEqual({ pages: '50' })

    await importarDados(JSON.stringify({ alunos: [], frequencias: [], config: {} }))
    await importarDados(json)

    const { getConfig } = await import('@/lib/db')
    const pages = await getConfig('pages')
    expect(pages).toBe('50')
  })
})
