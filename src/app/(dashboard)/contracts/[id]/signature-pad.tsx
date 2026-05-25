"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Eraser, Loader2, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signContract } from "@/actions/contracts";

interface SignaturePadProps {
  contractId: string;
  role: "owner" | "tenant";
}

export function SignaturePad({ contractId, role }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1A3A52";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPoint = (
    e: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawingRef.current = true;
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawnRef.current = true;
    if (empty) setEmpty(false);
  };

  const handleUp = (e: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setEmpty(true);
    setError(null);
  };

  const submit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) {
      setError("Veuillez dessiner votre signature avant de valider.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res = await signContract({ contractId, signatureDataUrl: dataUrl });
      if (!res.success) {
        setError(res.error ?? "Échec de la signature. Réessayez.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur inattendue à la signature.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Dessinez votre signature dans le cadre ci-dessous
        {role === "owner" ? " (propriétaire)" : " (locataire)"}.
      </p>
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        className="w-full touch-none rounded-md border border-input bg-white"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={submitting || empty}
        >
          <Eraser className="mr-1 size-3.5" />
          Effacer
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={submitting || empty}
          className="bg-kaza-green hover:bg-kaza-green/90"
        >
          {submitting ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : (
            <PenLine className="mr-1 size-3.5" />
          )}
          Signer
        </Button>
      </div>
    </div>
  );
}
