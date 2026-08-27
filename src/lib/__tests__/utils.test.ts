import { describe, it, expect } from 'vitest'
import { diasNoMes, formatDate, calcularResumo, getInitials } from '../utils'

describe('diasNoMes', () => {
  it('janeiro tem 31 dias', () => expect(diasNoMes(2024, 0)).toBe(31))
  it('abril tem 30 dias', () => expect(diasNoMes(2024, 3)).toBe(30))
  it('fevereiro não bissexto tem 28', () => expect(diasNoMes(2023, 1)).toBe(28))
  it('fevereiro bissexto tem 29', () => expect(diasNoMes(2024, 1)).toBe(29))
})

describe('formatDate', () => {
  it('formata data corretamente', () => {
    expect(formatDate(2024, 0, 1)).toBe('2024-01-01')
    expect(formatDate(2024, 11, 31)).toBe('2024-12-31')
    expect(formatDate(2024, 2, 5)).toBe('2024-03-05')
  })
})

describe('calcularResumo', () => {
  it('retorna zeros para vazio', () => {
    expect(calcularResumo({})).toEqual({ faltas: 0, atestados: 0, total: 0 })
  })

  it('conta faltas', () => {
    const f = { '2024-01-01': 'falta', '2024-01-02': 'falta' }
    expect(calcularResumo(f)).toEqual({ faltas: 2, atestados: 0, total: 2 })
  })

  it('conta atestados', () => {
    const f = { '2024-01-01': 'atestado' }
    expect(calcularResumo(f)).toEqual({ faltas: 0, atestados: 1, total: 1 })
  })

  it('soma ambos', () => {
    const f = { '2024-01-01': 'falta', '2024-01-02': 'atestado', '2024-01-03': 'falta' }
    expect(calcularResumo(f)).toEqual({ faltas: 2, atestados: 1, total: 3 })
  })

  it('ignora valores nulos', () => {
    const f = { '2024-01-01': 'falta', '2024-01-02': null }
    expect(calcularResumo(f)).toEqual({ faltas: 1, atestados: 0, total: 1 })
  })
})

describe('getInitials', () => {
  it('extrai iniciais de nome completo', () => {
    expect(getInitials('João Silva')).toBe('JS')
  })

  it('extrai iniciais de nome com múltiplas partes', () => {
    expect(getInitials('Maria da Conceição Souza')).toBe('MS')
  })

  it('retorna única letra para nome simples', () => {
    expect(getInitials('João')).toBe('J')
  })

  it('retorna ? para string vazia', () => {
    expect(getInitials('')).toBe('?')
  })
})
