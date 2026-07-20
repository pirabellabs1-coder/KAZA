"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  lang?: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-kaza-navy">
      {lang && (
        <span className="absolute left-3 top-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {lang}
        </span>
      )}
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded-md border border-white/15 bg-white/10 p-1.5 text-white/70 opacity-0 transition hover:bg-white/20 group-hover:opacity-100"
        aria-label="Copier le code"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
      <div className="overflow-x-auto px-4 pb-4 pt-7">
        <pre className="whitespace-pre text-xs leading-relaxed text-white/90">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
