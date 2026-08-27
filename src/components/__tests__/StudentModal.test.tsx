import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentModal from '../StudentModal'
import type { Aluno } from '@/lib/types'

describe('StudentModal', () => {
  const onClose = vi.fn()
  const onSave = vi.fn()

  it('renderiza nada quando fechado', () => {
    const { container } = render(
      <StudentModal open={false} aluno={null} onClose={onClose} onSave={onSave} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renderiza Novo Aluno quando aluno é null', () => {
    render(
      <StudentModal open={true} aluno={null} onClose={onClose} onSave={onSave} />
    )
    expect(screen.getByText('Novo Aluno')).toBeDefined()
    expect(screen.getByPlaceholderText('Ex: João Silva')).toBeDefined()
    expect(screen.getByText('Salvar')).toBeDefined()
    expect(screen.getByText('Cancelar')).toBeDefined()
  })

  it('renderiza Editar Aluno com dados preenchidos', () => {
    const aluno: Aluno = { id: 1, ano: 2026, nome: 'João Silva', created_at: '2024-01-01' }
    render(
      <StudentModal open={true} aluno={aluno} onClose={onClose} onSave={onSave} />
    )
    expect(screen.getByText('Editar Aluno')).toBeDefined()
    const nomeInput = screen.getByPlaceholderText('Ex: João Silva') as HTMLInputElement
    expect(nomeInput.value).toBe('João Silva')
  })

  it('chama onSave com nome ao submeter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <StudentModal open={true} aluno={null} defaultAno={2026} onClose={onClose} onSave={onSave} />
    )
    await userEvent.type(screen.getByPlaceholderText('Ex: João Silva'), 'Maria Souza')
    await userEvent.click(screen.getByText('Salvar'))
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Maria Souza', 2026)
    })
  })

  it('chama onClose após salvar com sucesso', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(
      <StudentModal open={true} aluno={null} defaultAno={2026} onClose={onClose} onSave={onSave} />
    )
    await userEvent.type(screen.getByPlaceholderText('Ex: João Silva'), 'Carlos')
    await userEvent.click(screen.getByText('Salvar'))
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it('chama onClose ao clicar em Cancelar', async () => {
    const onClose = vi.fn()
    render(
      <StudentModal open={true} aluno={null} onClose={onClose} onSave={onSave} />
    )
    await userEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('mostra erro quando onSave lança exceção', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Erro ao salvar'))
    render(
      <StudentModal open={true} aluno={null} defaultAno={2026} onClose={onClose} onSave={onSave} />
    )
    await userEvent.type(screen.getByPlaceholderText('Ex: João Silva'), 'Ana')
    await userEvent.click(screen.getByText('Salvar'))
    await waitFor(() => {
      expect(screen.getByText('Erro ao salvar')).toBeDefined()
    })
  })
})
