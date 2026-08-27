import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MonthSelector from '../MonthSelector'

describe('MonthSelector', () => {
  const defaultProps = { ano: 2024, mes: 0, onAnoChange: vi.fn(), onMesChange: vi.fn() }

  it('renderiza todos os meses', () => {
    render(<MonthSelector {...defaultProps} />)
    const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    for (const m of mesesAbrev) {
      expect(screen.getByText(m)).toBeDefined()
    }
  })

  it('destaca o mês ativo', () => {
    render(<MonthSelector {...defaultProps} mes={3} />)
    const btnAbr = screen.getByText('Abr')
    expect(btnAbr.className).toContain('bg-white')
  })

  it('não destaca mês inativo', () => {
    render(<MonthSelector {...defaultProps} mes={3} />)
    const btnJan = screen.getByText('Jan')
    expect(btnJan.className).not.toContain('bg-white')
  })

  it('chama onMesChange ao clicar', async () => {
    const onMesChange = vi.fn()
    render(<MonthSelector {...defaultProps} onMesChange={onMesChange} />)
    await userEvent.click(screen.getByText('Mar'))
    expect(onMesChange).toHaveBeenCalledWith(2)
  })

  it('navega ano anterior', async () => {
    const onAnoChange = vi.fn()
    render(<MonthSelector {...defaultProps} onAnoChange={onAnoChange} />)
    const [prevBtn] = screen.getAllByRole('button')
    expect(prevBtn.textContent).toBe('‹')
    await userEvent.click(prevBtn)
    expect(onAnoChange).toHaveBeenCalledWith(2023)
  })

  it('navega próximo ano', async () => {
    const onAnoChange = vi.fn()
    render(<MonthSelector {...defaultProps} onAnoChange={onAnoChange} />)
    const buttons = screen.getAllByRole('button')
    const nextBtn = buttons.find(b => b.textContent === '›')
    expect(nextBtn).toBeDefined()
    await userEvent.click(nextBtn!)
    expect(onAnoChange).toHaveBeenCalledWith(2025)
  })

  it('exibe o ano atual', () => {
    render(<MonthSelector {...defaultProps} ano={2025} />)
    expect(screen.getByText('2025')).toBeDefined()
  })
})
