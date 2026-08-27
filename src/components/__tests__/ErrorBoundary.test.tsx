import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>Conteúdo normal</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Conteúdo normal')).toBeDefined()
  })

  it('renderiza fallback quando child lança erro', () => {
    const Thrower = () => { throw new Error('Test error') }
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    )
    expect(screen.getByText('Algo deu errado')).toBeDefined()
    expect(screen.getByText('Test error')).toBeDefined()
    expect(screen.getByText('Recarregar')).toBeDefined()
    expect(screen.getByText('Voltar ao Início')).toBeDefined()
  })
})
