import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  it('renderiza nada quando fechado', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Teste" message="Mensagem" onConfirm={onConfirm} onCancel={onCancel} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renderiza título e mensagem quando aberto', () => {
    render(
      <ConfirmDialog open={true} title="Remover Aluno" message="Tem certeza?" onConfirm={onConfirm} onCancel={onCancel} />
    )
    expect(screen.getByText('Remover Aluno')).toBeDefined()
    expect(screen.getByText('Tem certeza?')).toBeDefined()
  })

  it('renderiza Confirmar e Cancelar como labels padrão', () => {
    render(
      <ConfirmDialog open={true} title="Teste" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />
    )
    expect(screen.getByText('Confirmar')).toBeDefined()
    expect(screen.getByText('Cancelar')).toBeDefined()
  })

  it('renderiza labels customizados', () => {
    render(
      <ConfirmDialog open={true} title="Teste" message="Msg" confirmLabel="Sim" cancelLabel="Não" onConfirm={onConfirm} onCancel={onCancel} />
    )
    expect(screen.getByText('Sim')).toBeDefined()
    expect(screen.getByText('Não')).toBeDefined()
  })

  it('chama onConfirm ao clicar em confirmar', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog open={true} title="Teste" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />
    )
    await userEvent.click(screen.getByText('Confirmar'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('chama onCancel ao clicar em cancelar', async () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open={true} title="Teste" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />
    )
    await userEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('usa cor danger para confirmLabel quando variant=danger', () => {
    render(
      <ConfirmDialog open={true} title="Teste" message="Msg" variant="danger" confirmLabel="Remover" onConfirm={onConfirm} onCancel={onCancel} />
    )
    const btn = screen.getByText('Remover')
    expect(btn.className).toContain('bg-red-500')
  })

  it('usa cor default para confirmLabel quando variant=default', () => {
    render(
      <ConfirmDialog open={true} title="Teste" message="Msg" variant="default" onConfirm={onConfirm} onCancel={onCancel} />
    )
    const btn = screen.getByText('Confirmar')
    expect(btn.className).toContain('bg-indigo-600')
  })
})
