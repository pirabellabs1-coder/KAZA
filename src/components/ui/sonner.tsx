"use client"

import * as React from "react"
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  X as XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type ToastVariant = "success" | "error" | "info" | "warning"

export type Toast = {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

type Listener = (toast: Toast) => void

const listeners: Set<Listener> = new Set()

export function emitToast(toast: Omit<Toast, "id">): void {
  if (typeof window === "undefined") return
  const fullToast: Toast = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    duration: 4000,
    ...toast,
  }
  listeners.forEach((listener) => listener(fullToast))
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
}

const variantIconStyles: Record<ToastVariant, string> = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
  warning: "text-amber-600",
}

const VariantIcon = ({ variant }: { variant: ToastVariant }) => {
  const className = cn("size-5 shrink-0", variantIconStyles[variant])
  switch (variant) {
    case "success":
      return <CheckCircle2 className={className} aria-hidden />
    case "error":
      return <XCircle className={className} aria-hidden />
    case "warning":
      return <AlertTriangle className={className} aria-hidden />
    case "info":
    default:
      return <Info className={className} aria-hidden />
  }
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    const listener: Listener = (toast) => {
      setToasts((prev) => [...prev, toast])
      const duration = toast.duration ?? 4000
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, duration)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      data-slot="toaster"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          data-slot="toast"
          data-variant={toast.variant}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-md border p-3 shadow-lg",
            "animate-in slide-in-from-right-5 fade-in-0 duration-200",
            variantStyles[toast.variant]
          )}
        >
          <VariantIcon variant={toast.variant} />
          <p className="flex-1 text-sm leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
            aria-label="Fermer la notification"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
