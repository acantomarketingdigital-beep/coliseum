"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PinInputProps {
  onComplete: (pin: string) => void;
  onChange?: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
  resetTrigger?: number;
}

export function PinInput({
  onComplete,
  onChange,
  error = false,
  disabled = false,
  resetTrigger = 0,
}: PinInputProps) {
  const [value, setValue] = useState("");
  const [shake, setShake]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset quando resetTrigger muda
  useEffect(() => {
    setValue("");
    inputRef.current?.focus();
  }, [resetTrigger]);

  // Shake animation em erro
  useEffect(() => {
    if (error && value.length > 0) {
      setShake(true);
      const t = setTimeout(() => {
        setShake(false);
        setValue("");
      }, 600);
      return () => clearTimeout(t);
    }
  }, [error, value.length]);

  // Dispara quando 4 dígitos completos
  useEffect(() => {
    if (value.length === 4) {
      onComplete(value);
    }
  }, [value, onComplete]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 4);
    setValue(cleaned);
    onChange?.(cleaned);
  }, [onChange]);

  return (
    <div
      className={`flex gap-3 justify-center cursor-text ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      {/* Input invisível — captura teclado físico e numérico do celular */}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        aria-label="PIN de 4 dígitos"
        autoFocus
        autoComplete="off"
      />

      {Array.from({ length: 4 }).map((_, i) => {
        const filled    = i < value.length;
        const active    = i === value.length && !disabled;
        const hasError  = error || shake;

        return (
          <div
            key={i}
            className={`
              w-16 h-16 rounded-2xl border-2 flex items-center justify-center
              transition-all duration-150 select-none
              ${hasError
                ? "border-red-500 bg-red-500/10"
                : active
                  ? "border-yellow-400 bg-zinc-900 shadow-[0_0_12px_rgba(250,204,21,0.3)]"
                  : filled
                    ? "border-yellow-400/50 bg-zinc-900"
                    : "border-zinc-700 bg-zinc-900"
              }
            `}
          >
            {filled && (
              <span className="w-3 h-3 rounded-full bg-yellow-400 block" />
            )}
          </div>
        );
      })}
    </div>
  );
}
