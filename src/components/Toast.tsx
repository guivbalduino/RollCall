'use client'

import { useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error'

export interface ToastMessage {
  type: ToastType
  message: string
}

interface ToastProps {
  toast: ToastMessage | null
  onClose: () => void
}

export default function Toast({ toast, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (toast) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        closeTimerRef.current = setTimeout(onClose, 300)
      }, 3000)
      return () => {
        clearTimeout(timer)
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current)
          closeTimerRef.current = null
        }
      }
    }
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
        toast.type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
      }`}>
        {toast.type === 'success' ? (
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {toast.message}
      </div>
    </div>
  )
}
