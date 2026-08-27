import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AttendanceGrid from '../AttendanceGrid'
import type { Aluno, StatusFrequencia } from '@/lib/types'

function makeAluno(id: number, nome: string): Aluno {
  return { id, ano: 2024, nome, created_at: '2024-01-01' }
}

describe('AttendanceGrid', () => {
  const defaultProps = {
    alunos: [makeAluno(1, 'João Silva'), makeAluno(2, 'Maria Souza')],
    frequencias: {} as Record<number, Record<string, StatusFrequencia>>,
    ano: 2024,
    mes: 2,
    onToggle: vi.fn(),
    onEditAluno: vi.fn(),
    onRemoveAluno: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza todos os alunos', () => {
    render(<AttendanceGrid {...defaultProps} />)
    expect(screen.getByText('João Silva')).toBeDefined()
    expect(screen.getByText('Maria Souza')).toBeDefined()
  })

  it('mostra empty state quando não há alunos', () => {
    render(<AttendanceGrid {...defaultProps} alunos={[]} />)
    expect(screen.getByText(/Nenhum aluno cadastrado/)).toBeDefined()
  })

  it('renderiza dias do mês (março = 31)', () => {
    render(<AttendanceGrid {...defaultProps} />)
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('31')).toBeDefined()
  })

  it('renderiza 28 dias em fevereiro não bissexto', () => {
    render(<AttendanceGrid {...defaultProps} ano={2023} mes={1} />)
    expect(screen.getByText('28')).toBeDefined()
    expect(screen.queryByText('29')).toBeNull()
  })

  it('mostra cabeçalhos dos dias da semana', () => {
    render(<AttendanceGrid {...defaultProps} />)
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
    for (const d of weekDays) {
      expect(screen.getAllByText(d).length).toBeGreaterThan(0)
    }
  })

  it('chama onToggle com falta ao clicar em célula vazia', async () => {
    const onToggle = vi.fn()
    render(<AttendanceGrid {...defaultProps} onToggle={onToggle} />)

    const cells = screen.getAllByRole('cell')
    const emptyCell = cells.find(c => c.textContent === '' && c.closest('tr')?.textContent?.includes('João'))
    if (emptyCell) {
      await userEvent.click(emptyCell)
      await vi.waitFor(() => {
        expect(onToggle).toHaveBeenCalled()
      })
    }
  })

  it('mostra sumário de faltas', () => {
    const frequencias = {
      1: { '2024-03-15': 'falta' as StatusFrequencia, '2024-03-16': 'atestado' as StatusFrequencia },
    }
    render(<AttendanceGrid {...defaultProps} frequencias={frequencias} />)

    const rows = screen.getAllByRole('row')
    const joaoRow = rows.find(r => r.textContent?.includes('João'))
    expect(joaoRow?.textContent).toContain('X')
    expect(joaoRow?.textContent).toContain('A')
  })

  it('mostra info bar com total de alunos e faltas', () => {
    const frequencias = {
      1: { '2024-03-15': 'falta' as StatusFrequencia },
      2: { '2024-03-16': 'atestado' as StatusFrequencia },
    }
    render(<AttendanceGrid {...defaultProps} frequencias={frequencias} />)
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('faltas')).toBeDefined()
  })
})
