"use client";

import { useEffect, useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  className,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const updateAt = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join(""));
  };

  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      updateAt(index, "");
      return;
    }
    if (cleaned.length === 1) {
      updateAt(index, cleaned);
      if (index < length - 1) inputsRef.current[index + 1]?.focus();
      return;
    }
    // Paste-style fill if multiple chars came in
    const chars = cleaned.slice(0, length - index).split("");
    const next = digits.slice();
    chars.forEach((c, i) => (next[index + i] = c));
    onChange(next.join(""));
    const targetIndex = Math.min(index + chars.length, length - 1);
    inputsRef.current[targetIndex]?.focus();
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, "").slice(0, length));
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className={cn("flex gap-2 sm:gap-3", className)}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-input bg-white text-center text-xl font-semibold shadow-sm",
            "outline-none transition focus:border-kaza-blue focus:ring-2 focus:ring-kaza-blue/30",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}
