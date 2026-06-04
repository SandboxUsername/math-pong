"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  active: boolean;
  onChange: (value: string) => void;
};

export function AnswerInput({ value, active, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (active && !isEditingSettings()) {
      inputRef.current?.focus();
    }
  }, [active, value]);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">Respuesta</span>
      <input
        ref={inputRef}
        value={value}
        disabled={!active}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        enterKeyHint="done"
        aria-label="Respuesta numerica"
        onBlur={() => {
          window.setTimeout(() => {
            if (active && !isEditingSettings()) {
              inputRef.current?.focus();
            }
          }, 0);
        }}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        className="h-14 w-full rounded-lg border border-white/15 bg-white px-4 text-center text-3xl font-black text-slate-950 outline-none ring-4 ring-transparent transition focus:ring-teal-300/45 disabled:cursor-not-allowed disabled:bg-slate-300"
      />
    </label>
  );
}

function isEditingSettings() {
  return document.activeElement?.closest("[data-settings-panel]") !== null;
}
