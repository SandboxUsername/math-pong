"use client";

import { useEffect, useRef, useState } from "react";
import type { GameSettings, OperationKind, Range } from "@/types/game";

type Props = {
  settings: GameSettings;
  disabled: boolean;
  onChange: (settings: GameSettings) => void;
};

const operationLabels: Record<OperationKind, string> = {
  add: "Suma",
  subtract: "Resta",
  multiply: "Multiplicacion",
  divide: "Division exacta"
};

export function SettingsPanel({ settings, disabled, onChange }: Props) {
  function updateRange(kind: OperationKind, range: Range) {
    onChange({
      ...settings,
      operations: {
        ...settings.operations,
        [kind]: range
      }
    });
  }

  return (
    <details className="rounded-lg border border-white/10 bg-white/7 p-3" data-settings-panel>
      <summary className="cursor-pointer select-none text-sm font-bold text-white">Ajustes</summary>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ToggleField
            disabled={disabled}
            label="Mostrar carriles"
            checked={settings.showLaneGuides}
            onChange={(showLaneGuides) => onChange({ ...settings, showLaneGuides })}
          />
          <ToggleField
            disabled={disabled}
            label="Mostrar trayectoria"
            checked={settings.showTrajectoryGuide}
            onChange={(showTrajectoryGuide) => onChange({ ...settings, showTrajectoryGuide })}
          />
          <NumberField
            disabled={disabled}
            label="Movimiento facil"
            value={settings.easyMovementMultiplier}
            min={0.1}
            max={5}
            step="0.1"
            onChange={(easyMovementMultiplier) => onChange({ ...settings, easyMovementMultiplier })}
          />
          <NumberField
            disabled={disabled}
            label="Movimiento dificil"
            value={settings.hardMovementMultiplier}
            min={0.1}
            max={10}
            step="0.1"
            onChange={(hardMovementMultiplier) => onChange({ ...settings, hardMovementMultiplier })}
          />
          <NumberField
            disabled={disabled}
            label="Velocidad inicial"
            value={settings.ballSpeed}
            min={0.1}
            max={20}
            step="0.1"
            onChange={(ballSpeed) => onChange({ ...settings, ballSpeed })}
          />
          <NumberField
            disabled={disabled}
            label="Duracion 0 libre"
            value={settings.durationSeconds ?? 0}
            min={0}
            max={600}
            integer
            onChange={(durationSeconds) =>
              onChange({ ...settings, durationSeconds: durationSeconds > 0 ? durationSeconds : null })
            }
          />
        </div>

        <div className="space-y-3">
          {(["add", "subtract", "multiply", "divide"] as OperationKind[]).map((kind) => (
            <div key={kind} className="grid grid-cols-[1fr_74px_74px] items-end gap-2">
              <p className="pb-2 text-sm font-semibold text-slate-200">{operationLabels[kind]}</p>
              <NumberField
                disabled={disabled}
                label="Min"
                value={settings.operations[kind].min}
                min={1}
                max={99}
                integer
                onChange={(min) => updateRange(kind, { ...settings.operations[kind], min })}
              />
              <NumberField
                disabled={disabled}
                label="Max"
                value={settings.operations[kind].max}
                min={1}
                max={99}
                integer
                onChange={(max) => updateRange(kind, { ...settings.operations[kind], max })}
              />
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

type ToggleFieldProps = {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleField({ label, checked, disabled, onChange }: ToggleFieldProps) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950 px-3">
      <span className="text-xs font-semibold text-slate-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-teal-300 disabled:opacity-50"
      />
    </label>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: string;
  integer?: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
};

function NumberField({
  label,
  value,
  min,
  max,
  step,
  integer = false,
  disabled,
  onChange
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(String(value));
    }
  }, [value]);

  function commitDraft() {
    focusedRef.current = false;
    const parsed = Number(draft.replace(",", "."));
    const fallback = Number.isFinite(value) ? value : min;
    const rawValue = Number.isFinite(parsed) ? parsed : fallback;
    const nextValue = Math.min(max, Math.max(min, integer ? Math.round(rawValue) : rawValue));
    setDraft(String(nextValue));
    onChange(nextValue);
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-300">{label}</span>
      <input
        type="text"
        value={draft}
        inputMode={integer ? "numeric" : "decimal"}
        pattern={integer ? "[0-9]*" : "[0-9]*[.,]?[0-9]*"}
        step={step}
        disabled={disabled}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-10 w-full rounded-md border border-white/15 bg-slate-950 px-2 text-sm font-bold text-white outline-none focus:border-teal-300 disabled:opacity-50"
      />
    </label>
  );
}
