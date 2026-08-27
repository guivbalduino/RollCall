'use client'

import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import type { Aluno, StatusFrequencia } from '@/lib/types'
import {
  diasNoMes,
  formatDate,
  calcularResumo,
  getInitials,
  getAvatarStyle,
} from '@/lib/utils'
import { getConfig, setConfig } from '@/lib/db'

interface AttendanceGridProps {
  alunos: Aluno[]
  frequencias: Record<number, Record<string, StatusFrequencia>>
  ano: number
  mes: number
  onToggle: (alunoId: number, data: string, novoStatus: StatusFrequencia) => void
  onEditAluno: (aluno: Aluno) => void
  onRemoveAluno: (alunoId: number) => void
  onViewHistory?: (aluno: Aluno) => void
}

const DIA_SEMANA_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const DEFAULT_PAGES = 35

export default function AttendanceGrid({
  alunos,
  frequencias,
  ano,
  mes,
  onToggle,
  onEditAluno,
  onRemoveAluno,
  onViewHistory,
}: AttendanceGridProps) {
  const dias = diasNoMes(ano, mes)
  const clickTimers = useRef<Record<string, number>>({})
  const animatingCells = useRef<Set<string>>(new Set())
  const [, setAnimTick] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const [focusedRow, setFocusedRow] = useState<number | null>(null)
  const [focusedCol, setFocusedCol] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGES)

  useEffect(() => {
    getConfig('pages').then(v => {
      if (v) {
        const n = Number(v)
        if (!isNaN(n) && n > 0) setItemsPerPage(n)
      }
    })
  }, [])

  useEffect(() => {
    setConfig('pages', String(itemsPerPage))
    setPage(0)
  }, [itemsPerPage])

  useEffect(() => {
    if (page > 0 && page >= Math.ceil(alunos.length / itemsPerPage)) {
      setPage(0)
    }
  }, [alunos.length, itemsPerPage, page])

  const hoje = useMemo(() => {
    const d = new Date()
    return {
      dia: d.getDate(),
      mes: d.getMonth(),
      ano: d.getFullYear(),
    }
  }, [])

  const totalPages = useMemo(() => Math.ceil(alunos.length / itemsPerPage), [alunos.length, itemsPerPage])
  const paginatedAlunos = useMemo(
    () => alunos.slice(page * itemsPerPage, (page + 1) * itemsPerPage),
    [alunos, page, itemsPerPage]
  )

  const handleClick = useCallback((alunoId: number, dia: number) => {
    const key = `${alunoId}-${dia}`
    const data = formatDate(ano, mes, dia)
    const now = Date.now()

    animatingCells.current.add(key)
    setTimeout(() => {
      animatingCells.current.delete(key)
      setAnimTick(v => v + 1)
    }, 200)

    if (clickTimers.current[key] && now - clickTimers.current[key] < 300) {
      delete clickTimers.current[key]
      const statusAtual = frequencias[alunoId]?.[data] ?? null
      const novoStatus: StatusFrequencia = statusAtual === 'atestado' ? null : 'atestado'
      onToggle(alunoId, data, novoStatus)
      return
    }

    clickTimers.current[key] = now
    setTimeout(() => {
      if (clickTimers.current[key] === now) {
        delete clickTimers.current[key]
        const statusAtual = frequencias[alunoId]?.[data] ?? null
        const novoStatus: StatusFrequencia = statusAtual === 'falta' ? null : 'falta'
        onToggle(alunoId, data, novoStatus)
      }
    }, 300)
  }, [ano, mes, frequencias, onToggle])

  const handleCellClick = useCallback((alunoIdx: number, alunoId: number, dia: number) => {
    setFocusedRow(alunoIdx)
    setFocusedCol(dia - 1)
    handleClick(alunoId, dia)
  }, [handleClick])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (focusedRow === null || focusedCol === null) return
    let newRow = focusedRow
    let newCol = focusedCol
    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, focusedRow - 1)
        break
      case 'ArrowDown':
        newRow = Math.min(paginatedAlunos.length - 1, focusedRow + 1)
        break
      case 'ArrowLeft':
        newCol = Math.max(0, focusedCol - 1)
        break
      case 'ArrowRight':
        newCol = Math.min(dias - 1, focusedCol + 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleClick(paginatedAlunos[focusedRow].id, focusedCol + 1)
        return
      default:
        return
    }
    e.preventDefault()
    setFocusedRow(newRow)
    setFocusedCol(newCol)
    const sel = `[data-row="${newRow}"][data-col="${newCol}"]`
    const cell = gridRef.current?.querySelector(sel) as HTMLElement | undefined
    cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [focusedRow, focusedCol, dias, paginatedAlunos, handleClick])

  const handleGridFocus = useCallback(() => {
    if (focusedRow === null || focusedCol === null) {
      setFocusedRow(0)
      setFocusedCol(0)
    }
  }, [focusedRow, focusedCol])

  const handleGridBlur = useCallback((e: React.FocusEvent) => {
    if (!gridRef.current?.contains(e.relatedTarget as Node)) {
      setFocusedRow(null)
      setFocusedCol(null)
    }
  }, [])

  const diasInfo = useMemo(() =>
    Array.from({ length: dias }, (_, i) => {
      const date = new Date(ano, mes, i + 1)
      const ds = date.getDay()
      return { dia: i + 1, isFimDeSemana: ds === 0 || ds === 6, diaSemana: ds }
    }),
    [ano, mes, dias]
  )

  const totalFaltas = useMemo(() =>
    alunos.reduce((acc, a) => acc + calcularResumo(frequencias[a.id] || {}).total, 0),
    [alunos, frequencias]
  )

  const empty = alunos.length === 0

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {!empty && (
        <div className="flex items-center gap-2 sm:gap-4 mb-3 px-1 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{alunos.length}</span>
            alunos
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-red-500 dark:text-red-400">{totalFaltas}</span>
            faltas
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0 hidden sm:block" />
          <div className="items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hidden sm:flex">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold">X</span>
            = sem atestado
          </div>
          <div className="items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hidden sm:flex">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">A</span>
            = com atestado
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 ml-auto">
            <span className="text-gray-300 dark:text-gray-600">setas</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] text-gray-500 dark:text-gray-400 font-bold">navegam</kbd>
            <span className="text-gray-300 dark:text-gray-600">Enter</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] text-red-500 dark:text-red-400 font-bold">X/A</kbd>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-2 px-1 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="hidden sm:inline">Página {page + 1} de {totalPages}</span>
            <span className="sm:hidden">{page + 1}/{totalPages}</span>
            <select
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 sm:px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option value={10}>10</option>
              <option value={35}>35</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      <div
        ref={gridRef}
        tabIndex={0}
        onFocus={handleGridFocus}
        onBlur={handleGridBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm scrollbar-thin outline-none focus:ring-2 focus:ring-indigo-400/30 focus:ring-inset"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">
              <th className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200/60 dark:border-gray-700/60 px-3 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[220px]">
                Aluno
              </th>
              {diasInfo.map(({ dia, isFimDeSemana, diaSemana }) => {
                const isHoje = hoje.dia === dia && hoje.mes === mes && hoje.ano === ano
                return (
                  <th
                    key={dia}
                    className={`border-b border-r border-gray-200/60 dark:border-gray-700/60 px-0.5 py-2 text-center w-10 relative ${
                      isFimDeSemana ? 'bg-gray-50/80 dark:bg-gray-800/80' : ''
                    } ${isHoje ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''}`}
                  >
                    {isHoje && (
                      <div className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[2px] bg-indigo-500 rounded-full" />
                    )}
                    <div className={`text-[9px] font-medium leading-tight ${isFimDeSemana ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {DIA_SEMANA_SHORT[diaSemana]}
                    </div>
                    <div className={`text-xs font-semibold leading-tight ${isHoje ? 'text-indigo-600 dark:text-indigo-400' : isFimDeSemana ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                      {dia}
                    </div>
                  </th>
                )
              })}
              <th className="sticky right-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-l border-gray-200/60 dark:border-gray-700/60 px-1.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                <svg className="w-3.5 h-3.5 mx-auto text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </th>
              <th className="sticky right-12 z-30 bg-gray-50 dark:bg-gray-800 border-b border-l border-gray-200/60 dark:border-gray-700/60 px-1.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                <span className="text-amber-400 dark:text-amber-500 font-bold text-sm">A</span>
              </th>
              <th className="sticky right-24 z-30 bg-gray-50 dark:bg-gray-800 border-b border-gray-200/60 dark:border-gray-700/60 px-1.5 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                Σ
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedAlunos.map((aluno, idx) => {
              const alunoFreqs = frequencias[aluno.id] || {}
              const resumo = calcularResumo(alunoFreqs)
              const [bgColor, textColor] = getAvatarStyle(aluno.id)
              const initials = getInitials(aluno.nome)

              return (
                <tr
                  key={aluno.id}
                  className={`group transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-900/15 border-b border-gray-100/80 dark:border-gray-800 last:border-b-0 ${
                    focusedRow === idx ? 'bg-indigo-50/20 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/15 border-r border-gray-100/60 dark:border-gray-800 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center shrink-0 text-xs font-bold ${textColor}`}>
                        {initials}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                        {aluno.nome}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-1 ml-auto shrink-0">
                        {onViewHistory && (
                          <button
                            onClick={() => onViewHistory(aluno)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-all"
                            title="Histórico"
                            aria-label="Histórico do aluno"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => onEditAluno(aluno)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                          title="Editar"
                          aria-label="Editar aluno"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onRemoveAluno(aluno.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Remover"
                          aria-label="Remover aluno"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>

                  {diasInfo.map(({ dia, isFimDeSemana }) => {
                    const data = formatDate(ano, mes, dia)
                    const status = alunoFreqs[data] ?? null
                    const isHoje = hoje.dia === dia && hoje.mes === mes && hoje.ano === ano
                    const isAnimating = animatingCells.current.has(`${aluno.id}-${dia}`)
                    const colIdx = dia - 1
                    const isFocused = focusedRow === idx && focusedCol === colIdx

                    return (
                      <td
                        key={dia}
                        data-row={idx}
                        data-col={colIdx}
                        onClick={() => handleCellClick(idx, aluno.id, dia)}
                        title={
                          status === null
                            ? 'Clique = Falta (X) • Duplo = Atestado (A)'
                            : status === 'falta'
                              ? 'Falta sem atestado — clique para limpar'
                              : 'Falta justificada — clique para limpar'
                        }
                        className={`
                          border-r border-b border-gray-100/60 dark:border-gray-800 px-0.5 py-2 text-center cursor-pointer select-none
                          transition-colors duration-100
                          ${isHoje ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}
                          ${status === null && !isFimDeSemana ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
                          ${isFimDeSemana ? 'bg-gray-50/40 dark:bg-gray-800/30' : ''}
                          ${isFocused ? 'ring-2 ring-indigo-400/60 ring-inset' : ''}
                        `}
                      >
                        <div className={`flex items-center justify-center min-h-[28px] transition-transform duration-150 ${isAnimating ? 'scale-90' : ''}`}>
                          {status === 'falta' ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400 text-xs font-bold ring-1 ring-red-200/50 dark:ring-red-800/40">
                              X
                            </span>
                          ) : status === 'atestado' ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400 text-xs font-bold ring-1 ring-amber-200/50 dark:ring-amber-800/40">
                              A
                            </span>
                          ) : null}
                        </div>
                      </td>
                    )
                  })}

                  <td className="sticky right-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/15 border-b border-l border-gray-100/60 dark:border-gray-800 px-1.5 py-2.5 text-center font-bold text-sm text-red-500 dark:text-red-400">
                    {resumo.faltas || <span className="text-gray-200 dark:text-gray-700">0</span>}
                  </td>
                  <td className="sticky right-12 z-10 bg-white dark:bg-gray-900 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/15 border-b border-l border-gray-100/60 dark:border-gray-800 px-1.5 py-2.5 text-center font-bold text-sm text-amber-500 dark:text-amber-400">
                    {resumo.atestados || <span className="text-gray-200 dark:text-gray-700">0</span>}
                  </td>
                  <td className="sticky right-24 z-10 bg-white dark:bg-gray-900 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/15 border-b border-gray-100/60 dark:border-gray-800 px-1.5 py-2.5 text-center font-bold text-sm text-gray-800 dark:text-gray-300">
                    {resumo.total || <span className="text-gray-200 dark:text-gray-700">0</span>}
                  </td>
                </tr>
              )
            })}

            {empty && (
              <tr>
                <td colSpan={dias + 4} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum aluno cadastrado</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                        Clique em <span className="font-semibold text-indigo-500 dark:text-indigo-400">Novo Aluno</span> no topo para começar
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
