import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Toast from '../Toast'

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renderiza nada quando toast é null', () => {
    const { container } = render(<Toast toast={null} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renderiza mensagem de sucesso', () => {
    render(<Toast toast={{ type: 'success', message: 'Sucesso!' }} onClose={vi.fn()} />)
    expect(screen.getByText('Sucesso!')).toBeDefined()
  })

  it('renderiza mensagem de erro', () => {
    render(<Toast toast={{ type: 'error', message: 'Erro!' }} onClose={vi.fn()} />)
    expect(screen.getByText('Erro!')).toBeDefined()
  })

  it('chama onClose após timeout', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast toast={{ type: 'success', message: 'Teste' }} onClose={onClose} />)
    vi.advanceTimersByTime(3300)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
