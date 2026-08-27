'use client'

interface MonthSelectorProps {
  ano: number
  mes: number
  onAnoChange: (ano: number) => void
  onMesChange: (mes: number) => void
}

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function MonthSelector({ ano, mes, onAnoChange, onMesChange }: MonthSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => onAnoChange(ano - 1)}
          className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all text-sm"
          title="Ano anterior"
        >
          ‹
        </button>
        <span className="px-3 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[4.5rem] text-center select-none">
          {ano}
        </span>
        <button
          onClick={() => onAnoChange(ano + 1)}
          className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all text-sm"
          title="Próximo ano"
        >
          ›
        </button>
      </div>
      <div className="flex gap-0.5 flex-wrap bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        {meses.map((nome, idx) => (
          <button
            key={idx}
            onClick={() => onMesChange(idx)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              idx === mes
                ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {nome.substring(0, 3)}
          </button>
        ))}
      </div>
    </div>
  )
}
