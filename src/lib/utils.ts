import type { StatusFrequencia, ResumoAluno } from './types'

export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate()
}

export function formatDate(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export function calcularResumo(frequencias: Record<string, StatusFrequencia>): ResumoAluno {
  let faltas = 0
  let atestados = 0
  for (const st of Object.values(frequencias)) {
    if (st === 'falta') faltas++
    else if (st === 'atestado') atestados++
  }
  return { faltas, atestados, total: faltas + atestados }
}

export function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const AVATAR_COLORS: [string, string][] = [
  ['bg-indigo-100 dark:bg-indigo-900/50', 'text-indigo-600 dark:text-indigo-300'],
  ['bg-emerald-100 dark:bg-emerald-900/50', 'text-emerald-600 dark:text-emerald-300'],
  ['bg-violet-100 dark:bg-violet-900/50', 'text-violet-600 dark:text-violet-300'],
  ['bg-rose-100 dark:bg-rose-900/50', 'text-rose-600 dark:text-rose-300'],
  ['bg-amber-100 dark:bg-amber-900/50', 'text-amber-600 dark:text-amber-300'],
  ['bg-cyan-100 dark:bg-cyan-900/50', 'text-cyan-600 dark:text-cyan-300'],
  ['bg-pink-100 dark:bg-pink-900/50', 'text-pink-600 dark:text-pink-300'],
  ['bg-teal-100 dark:bg-teal-900/50', 'text-teal-600 dark:text-teal-300'],
]

export function getAvatarStyle(id: number): [string, string] {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}
