'use client'

import React, { useRef, useState } from 'react'
import type { Aluno, StatusFrequencia, ResumoAluno } from '@/lib/types'
import {
  calcularResumo,
  getInitials,
  getAvatarStyle,
} from '@/lib/utils'

interface RelatorioViewProps {
  alunos: Aluno[]
  frequencias: Record<number, Record<string, StatusFrequencia>>
  ano: number
}

const BIMESTRES: { nome: string; label: string; meses: number[] }[] = [
  { nome: 'B1', label: 'Jan–Mar', meses: [0, 1, 2] },
  { nome: 'B2', label: 'Abr–Jun', meses: [3, 4, 5] },
  { nome: 'B3', label: 'Jul–Set', meses: [6, 7, 8] },
  { nome: 'B4', label: 'Out–Dez', meses: [9, 10, 11] },
]

function filtrarPorMeses(
  frequencias: Record<string, StatusFrequencia>,
  meses: number[],
  ano: number
): Record<string, StatusFrequencia> {
  const result: Record<string, StatusFrequencia> = {}
  const prefix = String(ano)
  for (const [data, status] of Object.entries(frequencias)) {
    if (!data.startsWith(prefix)) continue
    const mes = parseInt(data.substring(5, 7), 10) - 1
    if (meses.includes(mes)) {
      result[data] = status
    }
  }
  return result
}

function calcularTotaisBimestre(
  alunos: Aluno[],
  frequencias: Record<number, Record<string, StatusFrequencia>>,
  meses: number[],
  ano: number
): ResumoAluno {
  return alunos.reduce(
    (acc, aluno) => {
      const freqs = filtrarPorMeses(frequencias[aluno.id] || {}, meses, ano)
      const r = calcularResumo(freqs)
      return {
        faltas: acc.faltas + r.faltas,
        atestados: acc.atestados + r.atestados,
        total: acc.total + r.total,
      }
    },
    { faltas: 0, atestados: 0, total: 0 }
  )
}

export default function RelatorioView({ alunos, frequencias, ano }: RelatorioViewProps) {
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const empty = alunos.length === 0

  const totaisGerais = alunos.reduce(
    (acc, aluno) => {
      const r = calcularResumo(frequencias[aluno.id] || {})
      return {
        faltas: acc.faltas + r.faltas,
        atestados: acc.atestados + r.atestados,
        total: acc.total + r.total,
      }
    },
    { faltas: 0, atestados: 0, total: 0 }
  )

  const handleExportPDF = async () => {
    if (!containerRef.current || alunos.length === 0) return
    setGerandoPDF(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      const el = containerRef.current
      el.style.maxHeight = 'none'
      el.style.overflow = 'visible'
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })
      el.style.maxHeight = ''
      el.style.overflow = ''
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = pdfHeight
      let position = 0
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`relatorio-frequencia-${ano}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
    } finally {
      setGerandoPDF(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Relatório de Frequência — {ano}
        </h2>
        <button
          onClick={handleExportPDF}
          disabled={gerandoPDF || empty}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
          title="Exportar PDF"
        >
          {gerandoPDF ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
          )}
          Exportar PDF
        </button>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm scrollbar-thin">
      <table className="w-full border-collapse">
        <thead>
          <tr className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">
            <th className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200/60 dark:border-gray-700/60 px-3 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[220px]">
              Aluno
            </th>
            {BIMESTRES.map(b => (
              <React.Fragment key={b.nome}>
                <th className="border-b border-r border-gray-200/60 dark:border-gray-700/60 px-2 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16 bg-gray-50/80 dark:bg-gray-800/80">
                  <div>{b.nome} Σ</div>
                  <div className="text-[9px] font-normal text-gray-400 dark:text-gray-500">{b.label}</div>
                </th>
                <th className="border-b border-r border-gray-200/60 dark:border-gray-700/60 px-2 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  X
                </th>
                <th className="border-b border-r border-gray-200/60 dark:border-gray-700/60 px-2 py-2.5 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  A
                </th>
              </React.Fragment>
            ))}
            <th className="border-b px-2 py-2.5 text-center text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-16 bg-gray-50/80 dark:bg-gray-800/80">
              Ano Σ
            </th>
            <th className="border-b px-2 py-2.5 text-center text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12">
              Ano X
            </th>
            <th className="border-b px-2 py-2.5 text-center text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12">
              Ano A
            </th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno, idx) => {
            const alunoFreqs = frequencias[aluno.id] || {}
            const totaisAno = calcularResumo(alunoFreqs)
            const [bgColor, textColor] = getAvatarStyle(aluno.id)
            const initials = getInitials(aluno.nome)

            return (
              <tr
                key={aluno.id}
                className="transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-900/15 border-b border-gray-100/80 dark:border-gray-800 last:border-b-0"
              >
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-100/60 dark:border-gray-800 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${bgColor} flex items-center justify-center shrink-0 text-[10px] font-bold ${textColor}`}>
                      {initials}
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{aluno.nome}</span>
                  </div>
                </td>

                {BIMESTRES.map(b => {
                  const freqsBim = filtrarPorMeses(alunoFreqs, b.meses, ano)
                  const resumo = calcularResumo(freqsBim)
                  return (
                    <React.Fragment key={b.nome}>
                      <td className="px-2 py-2.5 text-center text-sm font-bold border-r border-b border-gray-100/60 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                        {resumo.total || <span className="text-gray-200 dark:text-gray-700">0</span>}
                      </td>
                      <td className="px-2 py-2.5 text-center text-sm font-semibold border-r border-b border-gray-100/60 dark:border-gray-800 text-red-500 dark:text-red-400">
                        {resumo.faltas || <span className="text-gray-200 dark:text-gray-700">0</span>}
                      </td>
                      <td className="px-2 py-2.5 text-center text-sm font-semibold border-r border-b border-gray-100/60 dark:border-gray-800 text-amber-500 dark:text-amber-400">
                        {resumo.atestados || <span className="text-gray-200 dark:text-gray-700">0</span>}
                      </td>
                    </React.Fragment>
                  )
                })}

                <td className="px-2 py-2.5 text-center text-sm font-bold border-b border-gray-100/60 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                  {totaisAno.total || <span className="text-gray-200 dark:text-gray-700">0</span>}
                </td>
                <td className="px-2 py-2.5 text-center text-sm font-bold border-b border-gray-100/60 dark:border-gray-800 text-red-500 dark:text-red-400">
                  {totaisAno.faltas || <span className="text-gray-200 dark:text-gray-700">0</span>}
                </td>
                <td className="px-2 py-2.5 text-center text-sm font-bold border-b border-gray-100/60 dark:border-gray-800 text-amber-500 dark:text-amber-400">
                  {totaisAno.atestados || <span className="text-gray-200 dark:text-gray-700">0</span>}
                </td>
              </tr>
            )
          })}

          {!empty && (
            <tr className="bg-gray-50/80 dark:bg-gray-800/80 sticky bottom-0 border-t-2 border-gray-200 dark:border-gray-700">
              <td className="sticky left-0 z-10 bg-gray-50/80 dark:bg-gray-800/80 border-r border-gray-200/60 dark:border-gray-700/60 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300">
                Total Geral
              </td>
              {BIMESTRES.map(b => {
                const totaisBim = calcularTotaisBimestre(alunos, frequencias, b.meses, ano)
                return (
                  <React.Fragment key={b.nome}>
                    <td className="px-2 py-2.5 text-center text-sm font-bold border-r border-gray-200/60 dark:border-gray-700/60 text-gray-800 dark:text-gray-200">
                      {totaisBim.total}
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm font-bold border-r border-gray-200/60 dark:border-gray-700/60 text-red-500 dark:text-red-400">
                      {totaisBim.faltas}
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm font-bold border-r border-gray-200/60 dark:border-gray-700/60 text-amber-500 dark:text-amber-400">
                      {totaisBim.atestados}
                    </td>
                  </React.Fragment>
                )
              })}
              <td className="px-2 py-2.5 text-center text-sm font-bold text-gray-800 dark:text-gray-200">
                {totaisGerais.total}
              </td>
              <td className="px-2 py-2.5 text-center text-sm font-bold text-red-500 dark:text-red-400">
                {totaisGerais.faltas}
              </td>
              <td className="px-2 py-2.5 text-center text-sm font-bold text-amber-500 dark:text-amber-400">
                {totaisGerais.atestados}
              </td>
            </tr>
          )}

          {empty && (
            <tr>
              <td colSpan={16} className="text-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                      Cadastre alunos e marque presenças para ver o relatório
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
