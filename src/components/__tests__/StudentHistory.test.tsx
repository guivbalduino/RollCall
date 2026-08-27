import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentHistory from '../StudentHistory'
import type { Aluno, StatusFrequencia } from '@/lib/types'

describe('StudentHistory', () => {
  const aluno: Aluno = { id: 1, ano: 2026, nome: 'João Silva', created_at: '2024-01-01' }

  it('renderiza nada quando fechado', () => {
    const { container } = render(
      <StudentHistory open={false} aluno={null} frequencias={{}} onClose={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renderiza nome e ano do aluno', () => {
    render(
      <StudentHistory open={true} aluno={aluno} frequencias={{}} onClose={vi.fn()} />
    )
    expect(screen.getByText('João Silva')).toBeDefined()
    expect(screen.getByText('Ano: 2026')).toBeDefined()
  })

  it('mostra empty state quando não há frequencias', () => {
    render(
      <StudentHistory open={true} aluno={aluno} frequencias={{}} onClose={vi.fn()} />
    )
    expect(screen.getByText('Nenhuma ocorrência registrada neste ano.')).toBeDefined()
  })

  it('mostra meses com frequencias', () => {
    const frequencias: Record<string, StatusFrequencia> = {
      '2026-03-15': 'falta',
      '2026-03-20': 'atestado',
    }
    render(
      <StudentHistory open={true} aluno={aluno} frequencias={frequencias} onClose={vi.fn()} />
    )
    expect(screen.getByText('Março')).toBeDefined()
    expect(screen.getByText('15 X')).toBeDefined()
    expect(screen.getByText('20 A')).toBeDefined()
  })

  it('fecha ao clicar no X', async () => {
    const onClose = vi.fn()
    render(
      <StudentHistory open={true} aluno={aluno} frequencias={{}} onClose={onClose} />
    )
    await userEvent.click(screen.getByLabelText('Fechar'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
