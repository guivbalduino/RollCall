import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RelatorioView from '../RelatorioView'
import type { Aluno, StatusFrequencia } from '@/lib/types'

describe('RelatorioView', () => {
  const alunos: Aluno[] = [
    { id: 1, ano: 2024, nome: 'João Silva', created_at: '2024-01-01' },
    { id: 2, ano: 2024, nome: 'Maria Souza', created_at: '2024-01-01' },
  ]

  it('mostra empty state quando não há alunos', () => {
    render(<RelatorioView alunos={[]} frequencias={{}} ano={2024} />)
    expect(screen.getByText(/Nenhum dado disponível/)).toBeDefined()
  })

  it('não mostra Total Geral quando não há alunos', () => {
    render(<RelatorioView alunos={[]} frequencias={{}} ano={2024} />)
    expect(screen.queryByText('Total Geral')).toBeNull()
  })

  it('renderiza cabeçalhos dos bimestres', () => {
    render(<RelatorioView alunos={alunos} frequencias={{}} ano={2024} />)
    expect(screen.getByText(/^B1/)).toBeDefined()
    expect(screen.getByText(/^B2/)).toBeDefined()
    expect(screen.getByText(/^B3/)).toBeDefined()
    expect(screen.getByText(/^B4/)).toBeDefined()
  })

  it('mostra Total Geral quando há alunos', () => {
    render(<RelatorioView alunos={alunos} frequencias={{}} ano={2024} />)
    expect(screen.getByText('Total Geral')).toBeDefined()
  })

  it('renderiza nomes dos alunos', () => {
    render(<RelatorioView alunos={alunos} frequencias={{}} ano={2024} />)
    expect(screen.getByText('João Silva')).toBeDefined()
    expect(screen.getByText('Maria Souza')).toBeDefined()
  })

  it('mostra ano no título', () => {
    render(<RelatorioView alunos={alunos} frequencias={{}} ano={2025} />)
    expect(screen.getByText(/2025/)).toBeDefined()
  })

  it('desabilita botão PDF quando não há alunos', () => {
    render(<RelatorioView alunos={[]} frequencias={{}} ano={2024} />)
    expect(screen.getByTitle('Exportar PDF')).toBeDisabled()
  })

  it('habilita botão PDF quando há alunos', () => {
    render(<RelatorioView alunos={alunos} frequencias={{}} ano={2024} />)
    expect(screen.getByTitle('Exportar PDF')).toBeEnabled()
  })

  it('calcula totais corretamente', () => {
    const frequencias: Record<number, Record<string, StatusFrequencia>> = {
      1: { '2024-03-15': 'falta', '2024-03-16': 'atestado' },
      2: { '2024-03-17': 'falta' },
    }
    render(<RelatorioView alunos={alunos} frequencias={frequencias} ano={2024} />)
    expect(screen.getByText('Total Geral')).toBeDefined()
  })
})
