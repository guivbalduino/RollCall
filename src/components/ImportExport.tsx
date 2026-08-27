'use client'

import { useState } from 'react'
import { exportarDados, importarDados, isTauri } from '@/lib/db'
import ConfirmDialog from './ConfirmDialog'
import type { ToastMessage } from './Toast'

interface ImportExportProps {
  onDataChange: () => void
  onToast: (toast: ToastMessage) => void
  variant?: 'export' | 'import'
}

export default function ImportExport({ onDataChange, onToast, variant }: ImportExportProps) {
  const [loading, setLoading] = useState<'export' | 'import' | null>(null)
  const [confirmImport, setConfirmImport] = useState(false)

  const handleExport = async () => {
    try {
      setLoading('export')
      const json = await exportarDados()

      if (isTauri()) {
        const { save } = await import('@tauri-apps/plugin-dialog')
        const { writeTextFile } = await import('@tauri-apps/plugin-fs')
        const path = await save({
          filters: [{ name: 'Backup JSON', extensions: ['json'] }],
          defaultPath: 'rollcall-backup.json',
        })
        if (path) {
          await writeTextFile(path, json)
          onToast({ type: 'success', message: 'Dados exportados com sucesso!' })
        }
      } else {
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rollcall-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        onToast({ type: 'success', message: 'Dados exportados com sucesso!' })
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
      onToast({ type: 'error', message: 'Erro ao exportar dados.' })
    } finally {
      setLoading(null)
    }
  }

  const handleImportClick = () => {
    setConfirmImport(true)
  }

  const handleImportConfirm = async () => {
    setConfirmImport(false)
    try {
      setLoading('import')

      if (isTauri()) {
        const { open } = await import('@tauri-apps/plugin-dialog')
        const { readTextFile } = await import('@tauri-apps/plugin-fs')
        const path = await open({
          filters: [{ name: 'Backup JSON', extensions: ['json'] }],
          multiple: false,
        })
        if (path) {
          const content = await readTextFile(path as string)
          await importarDados(content)
          onDataChange()
          onToast({ type: 'success', message: 'Dados importados com sucesso!' })
        }
      } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) return
          const text = await file.text()
          await importarDados(text)
          onDataChange()
          onToast({ type: 'success', message: 'Dados importados com sucesso!' })
        }
        input.click()
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      onToast({ type: 'error', message: 'Erro ao importar dados. Verifique se o arquivo é válido.' })
    } finally {
      setLoading(null)
    }
  }

  const handleImportCancel = () => {
    setConfirmImport(false)
  }

  if (variant === 'export') {
    return (
      <>
        <button
          onClick={handleExport}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition-all"
          title="Exportar dados"
          aria-label="Exportar dados"
        >
          {loading === 'export' ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Exportar
        </button>
      </>
    )
  }

  if (variant === 'import') {
    return (
      <>
        <button
          onClick={handleImportClick}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition-all"
          title="Importar dados"
          aria-label="Importar dados"
        >
          {loading === 'import' ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          Importar
        </button>

        <ConfirmDialog
          open={confirmImport}
          title="Importar Dados"
          message="Tem certeza? Todos os dados atuais serão substituídos pelos dados do arquivo importado."
          confirmLabel="Importar"
          variant="danger"
          onConfirm={handleImportConfirm}
          onCancel={handleImportCancel}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex gap-1.5">
        <button
          onClick={handleExport}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition-all"
          title="Exportar dados"
          aria-label="Exportar dados"
        >
          {loading === 'export' ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Exportar
        </button>
        <button
          onClick={handleImportClick}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition-all"
          title="Importar dados"
          aria-label="Importar dados"
        >
          {loading === 'import' ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          Importar
        </button>
      </div>

      <ConfirmDialog
        open={confirmImport}
        title="Importar Dados"
        message="Tem certeza? Todos os dados atuais serão substituídos pelos dados do arquivo importado."
        confirmLabel="Importar"
        variant="danger"
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />
    </>
  )
}
