import { emitToast, type ToastVariant } from "./sonner"

type ToastOptions = {
  duration?: number
}

const make =
  (variant: ToastVariant) =>
  (message: string, options?: ToastOptions): void => {
    if (typeof window === "undefined") return
    emitToast({ message, variant, duration: options?.duration })
  }

export const toast = {
  success: make("success"),
  error: make("error"),
  info: make("info"),
  warning: make("warning"),
}

export type { ToastVariant }
