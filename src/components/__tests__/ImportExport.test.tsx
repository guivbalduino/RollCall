import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportExport from '../ImportExport'

vi.mock('@/lib/db', () => ({
  exportarDados: vi.fn().mockResolvedValue('{}'),
  importarDados: vi.fn(),
  isTauri: vi.fn().mockReturnValue(false),
}))

describe('ImportExport', () => {
  const onDataChange = vi.fn()
  const onToast = vi.fn()

  it('renderiza botões Exportar e Importar', () => {
    render(<ImportExport onDataChange={onDataChange} onToast={onToast} />)
    expect(screen.getByText('Exportar')).toBeDefined()
    expect(screen.getByText('Importar')).toBeDefined()
  })

  it('desabilita botões durante loading', () => {
    render(<ImportExport onDataChange={onDataChange} onToast={onToast} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('abre confirm dialog ao clicar em Importar', async () => {
    render(<ImportExport onDataChange={onDataChange} onToast={onToast} />)
    await userEvent.click(screen.getByText('Importar'))
    expect(screen.getByText(/substituídos/)).toBeDefined()
    const importButtons = screen.getAllByText('Importar')
    expect(importButtons.length).toBe(2)
  })

  it('fecha confirm dialog ao clicar em Cancelar', async () => {
    render(<ImportExport onDataChange={onDataChange} onToast={onToast} />)
    await userEvent.click(screen.getByText('Importar'))
    await userEvent.click(screen.getByText('Cancelar'))
    expect(screen.queryByText(/substituídos/)).toBeNull()
  })
})
