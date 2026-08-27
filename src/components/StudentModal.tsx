'use client'

import { useState, useEffect, useRef } from 'react'
import type { Aluno } from '@/lib/types'

interface StudentModalProps {
  open: boolean
  aluno: Aluno | null
  defaultAno?: number
  onClose: () => void
  onSave: (nome: string, ano: number) => Promise<void>
}

export default function StudentModal({ open, aluno, defaultAno, onClose, onSave }: StudentModalProps) {
  const [nome, setNome] = useState('')
  const [ano, setAno] = useState(defaultAno ?? new Date().getFullYear())
  const [anoPickerOpen, setAnoPickerOpen] = useState(false)
  const [anoPickerPage, setAnoPickerPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const anoPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setNome(aluno?.nome ?? '')
      setAno(aluno?.ano ?? defaultAno ?? new Date().getFullYear())
      setError('')
      setAnoPickerOpen(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [aluno, open, defaultAno])

  useEffect(() => {
    if (!anoPickerOpen) return
    const handleClick = (e: MouseEvent) => {
      if (anoPickerRef.current && !anoPickerRef.current.contains(e.target as Node)) {
        setAnoPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [anoPickerOpen])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave(nome.trim(), ano)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 dark:border dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg">
            {aluno ? '✎' : '+'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {aluno ? 'Editar Aluno' : 'Novo Aluno'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {aluno ? 'Altere os dados do aluno' : 'Adicione um novo aluno à turma'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
            <input
              ref={inputRef}
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div ref={anoPickerRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ano</label>
            <button
              type="button"
              onClick={() => setAnoPickerOpen(!anoPickerOpen)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
            >
              {ano}
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${anoPickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {anoPickerOpen && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 w-full">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setAnoPickerPage(p => p - 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                  >
                    ‹
                  </button>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {ano + anoPickerPage * 12 - 6} – {ano + anoPickerPage * 12 + 5}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnoPickerPage(p => p + 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const y = ano + anoPickerPage * 12 - 6 + i
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => { setAno(y); setAnoPickerOpen(false); setAnoPickerPage(0) }}
                        className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                          y === ano
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-700'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {y}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
