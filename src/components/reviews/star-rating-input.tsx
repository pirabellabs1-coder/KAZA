"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<StarRatingInputProps["size"]>, string> = {
  sm: "size-5",
  md: "size-7",
  lg: "size-9",
};

export function StarRatingInput({
  value,
  onChange,
  max = 5,
  disabled = false,
  size = "md",
  className,
}: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="radiogroup"
      aria-label={`Note sur ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const index = i + 1;
        const isFilled = display >= index;

        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={value === index}
            aria-label={`${index} étoile${index > 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => !disabled && onChange(index)}
            onMouseEnter={() => !disabled && setHover(index)}
            onMouseLeave={() => !disabled && setHover(0)}
            className={cn(
              "rounded-md p-0.5 transition-all duration-150 ease-out outline-none",
              !disabled &&
                "cursor-pointer hover:scale-125 focus-visible:ring-2 focus-visible:ring-kaza-blue/40",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <Star
              className={cn(
                SIZE_CLASSES[size],
                "transition-colors duration-150",
                isFilled
                  ? "fill-kaza-warning text-kaza-warning"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
