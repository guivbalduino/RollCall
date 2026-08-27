'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  listarAlunos,
  criarAluno,
  atualizarAluno,
  removerAluno,
  listarFrequencias,
  alternarFrequencia,
  isTauri,
} from '@/lib/db'
import type { Aluno, StatusFrequencia } from '@/lib/types'
import AttendanceGrid from '@/components/AttendanceGrid'
import MonthSelector from '@/components/MonthSelector'
import StudentModal from '@/components/StudentModal'
import RelatorioView from '@/components/RelatorioView'
import ImportExport from '@/components/ImportExport'
import ConfirmDialog from '@/components/ConfirmDialog'
import Toast from '@/components/Toast'
import StudentHistory from '@/components/StudentHistory'
import ErrorBoundary from '@/components/ErrorBoundary'
import type { ToastMessage } from '@/components/Toast'

type AbaType = 'chamada' | 'relatorio' | 'importar'

export default function Home() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('rollcall-dark')
    if (stored !== null) {
      setDark(stored === 'true')
    } else {
      setDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('rollcall-dark', String(dark))
  }, [dark])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [frequencias, setFrequencias] = useState<Record<number, Record<string, StatusFrequencia>>>({})
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth())
  const [aba, setAba] = useState<AbaType>('chamada')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [tauriMode, setTauriMode] = useState(true)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [historyAluno, setHistoryAluno] = useState<Aluno | null>(null)

  const loadAlunos = useCallback(async (a?: number) => {
    try {
      const data = await listarAlunos(a)
      setAlunos(data)
      setTauriMode(isTauri())
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
    }
  }, [])

  const loadFrequencias = useCallback(async (a: number, m: number) => {
    try {
      const data = await listarFrequencias(a, m)
      const map: Record<number, Record<string, StatusFrequencia>> = {}
      for (const f of data) {
        if (!map[f.aluno_id]) map[f.aluno_id] = {}
        map[f.aluno_id][f.data] = f.status as StatusFrequencia
      }
      setFrequencias(map)
    } catch (error) {
      console.error('Erro ao carregar frequências:', error)
    }
  }, [])

  useEffect(() => {
    loadAlunos(ano).then(() => setLoaded(true))
  }, [loadAlunos, ano])

  useEffect(() => {
    if (loaded) loadFrequencias(ano, mes)
  }, [ano, mes, loaded, loadFrequencias])

  const handleToggle = useCallback(async (alunoId: number, data: string, novoStatus: StatusFrequencia) => {
    try {
      await alternarFrequencia(alunoId, data, novoStatus)
      setFrequencias(prev => {
        const updated = { ...prev }
        if (novoStatus === null) {
          if (updated[alunoId]) {
            const newFreqs = { ...updated[alunoId] }
            delete newFreqs[data]
            if (Object.keys(newFreqs).length === 0) {
              delete updated[alunoId]
            } else {
              updated[alunoId] = newFreqs
            }
          }
        } else {
          updated[alunoId] = { ...(updated[alunoId] || {}), [data]: novoStatus }
        }
        return updated
      })
    } catch (error) {
      console.error('Erro ao alternar frequência:', error)
    }
  }, [])

  const handleSaveAluno = async (nome: string, anoAluno: number) => {
    if (editingAluno) {
      await atualizarAluno(editingAluno.id, nome, anoAluno)
    } else {
      await criarAluno(nome, anoAluno)
    }
    await loadAlunos(ano)
  }

  const handleRemoveAluno = async () => {
    if (removingId === null) return
    await removerAluno(removingId)
    setRemovingId(null)
    await loadAlunos(ano)
    setFrequencias(prev => {
      const updated = { ...prev }
      delete updated[removingId]
      return updated
    })
  }

  const handleRefresh = () => {
    loadAlunos(ano)
    loadFrequencias(ano, mes)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900 flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900/95 border-b border-gray-200/70 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-900/50">
                RC
              </div>
              <div className="leading-tight">
                <h1 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">RollCall</h1>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Controle de Frequência</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <MonthSelector
                  ano={ano}
                  mes={mes}
                  onAnoChange={setAno}
                  onMesChange={setMes}
                />
              </div>

              <button
                onClick={() => setDark(prev => !prev)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                title={dark ? 'Modo claro' : 'Modo escuro'}
                aria-label={dark ? 'Modo claro' : 'Modo escuro'}
              >
                {dark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between min-h-12 py-1 sm:py-0 gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setAba('chamada')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                aba === 'chamada'
                  ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Chamada
            </button>
            <button
              onClick={() => setAba('relatorio')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                aba === 'relatorio'
                  ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Relatório
            </button>
            <button
              onClick={() => setAba('importar')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                aba === 'importar'
                  ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Importar/Exportar
            </button>
          </div>

          <div className="flex items-center gap-2">
            {aba === 'chamada' && (
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-28 sm:w-40 pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all"
                />
              </div>
            )}
            <button
              onClick={() => {
                setEditingAluno(null)
                setModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Novo Aluno</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="sm:hidden border-b border-gray-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-4 py-2">
        <MonthSelector
          ano={ano}
          mes={mes}
          onAnoChange={setAno}
          onMesChange={setMes}
        />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col min-h-0">
        <ErrorBoundary>
        {!loaded ? (
          <div className="flex items-center justify-center h-80">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">Carregando...</span>
            </div>
          </div>
        ) : aba === 'chamada' ? (
          <AttendanceGrid
            alunos={searchTerm ? alunos.filter(a => a.nome.toLowerCase().includes(searchTerm.toLowerCase())) : alunos}
            frequencias={frequencias}
            ano={ano}
            mes={mes}
            onToggle={handleToggle}
            onEditAluno={aluno => {
              setEditingAluno(aluno)
              setModalOpen(true)
            }}
            onRemoveAluno={id => setRemovingId(id)}
            onViewHistory={setHistoryAluno}
          />
        ) : aba === 'relatorio' ? (
          <RelatorioView
            alunos={alunos}
            frequencias={frequencias}
            ano={ano}
          />
        ) : (
          <div className="max-w-lg mx-auto py-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Importar / Exportar Dados</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm mx-auto">
                Exporte todos os dados para um arquivo de backup ou importe dados salvos anteriormente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Exportar</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Salve um arquivo JSON com todos os alunos e frequências.
                </p>
                <ImportExport onDataChange={handleRefresh} onToast={setToast} variant="export" />
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Importar</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Substitua todos os dados por um arquivo de backup.
                </p>
                <ImportExport onDataChange={handleRefresh} onToast={setToast} variant="import" />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 p-4">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  A importação substitui <strong>todos</strong> os dados atuais pelos dados do arquivo. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
          </div>
        )}
        </ErrorBoundary>
      </main>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-3 px-6 flex items-center justify-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 transition-colors duration-200">
        <span>RollCall</span>
        <span className="text-gray-300 dark:text-gray-600">&middot;</span>
        <span>Dados armazenados localmente</span>
        {!tauriMode && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Modo Desenvolvimento
          </span>
        )}
      </footer>

      <StudentModal
        open={modalOpen}
        aluno={editingAluno}
        defaultAno={ano}
        onClose={() => {
          setModalOpen(false)
          setEditingAluno(null)
        }}
        onSave={handleSaveAluno}
      />

      <ConfirmDialog
        open={removingId !== null}
        title="Remover Aluno"
        message="Tem certeza que deseja remover este aluno? Todas as frequências associadas serão perdidas."
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleRemoveAluno}
        onCancel={() => setRemovingId(null)}
      />

      <StudentHistory
        open={historyAluno !== null}
        aluno={historyAluno}
        frequencias={historyAluno ? frequencias[historyAluno.id] || {} : {}}
        onClose={() => setHistoryAluno(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
