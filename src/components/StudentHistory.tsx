'use client'

import { useMemo, useEffect } from 'react'
import type { Aluno, StatusFrequencia } from '@/lib/types'
import { calcularResumo, getInitials, getAvatarStyle } from '@/lib/utils'

interface StudentHistoryProps {
  open: boolean
  aluno: Aluno | null
  frequencias: Record<string, StatusFrequencia>
  onClose: () => void
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function StudentHistory({ open, aluno, frequencias, onClose }: StudentHistoryProps) {
  const [bgColor, textColor] = aluno ? getAvatarStyle(aluno.id) : ['', '']
  const initials = aluno ? getInitials(aluno.nome) : ''

  const mesesData = useMemo(() => {
    const result: { mes: number; nome: string; datas: { dia: number; status: StatusFrequencia }[]; faltas: number; atestados: number }[] = []
    for (let m = 0; m < 12; m++) {
      const datas: { dia: number; status: StatusFrequencia }[] = []
      for (const [data, status] of Object.entries(frequencias)) {
        if (status === null) continue
        const parts = data.split('-')
        const mesData = parseInt(parts[1], 10) - 1
        const diaData = parseInt(parts[2], 10)
        if (mesData === m) {
          datas.push({ dia: diaData, status })
        }
      }
      datas.sort((a, b) => a.dia - b.dia)
      const r = calcularResumo(
        Object.fromEntries(datas.map(d => [String(d.dia), d.status!]))
      )
      if (datas.length > 0) {
        result.push({ mes: m, nome: MESES[m], datas, faltas: r.faltas, atestados: r.atestados })
      }
    }
    return result
  }, [frequencias])

  const resumoAnual = useMemo(() => calcularResumo(frequencias), [frequencias])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open || !aluno) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col dark:border dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-sm font-bold ${textColor}`}>
              {initials}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{aluno.nome}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ano: {aluno.ano}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3 sm:gap-6 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total faltas</span>
              <p className="text-xl font-bold text-red-500 dark:text-red-400">{resumoAnual.faltas}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total atestados</span>
              <p className="text-xl font-bold text-amber-500 dark:text-amber-400">{resumoAnual.atestados}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total geral</span>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{resumoAnual.total}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mesesData.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
              Nenhuma ocorrência registrada neste ano.
            </div>
          ) : (
            mesesData.map(m => (
              <div key={m.mes} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-2.5 sm:p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{m.nome}</h3>
                  <div className="flex gap-3 text-xs">
                    <span className="text-red-500 dark:text-red-400 font-medium">{m.faltas} falta{m.faltas !== 1 ? 's' : ''}</span>
                    <span className="text-amber-500 dark:text-amber-400 font-medium">{m.atestados} atestado{m.atestados !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m.datas.map(d => (
                    <span
                      key={d.dia}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        d.status === 'falta'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {d.dia}
                      {d.status === 'falta' ? ' X' : ' A'}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
