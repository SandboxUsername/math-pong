"use client";

import { actionLabel } from "@/lib/operations";
import type { Operation } from "@/types/game";

type Props = {
  operations: Operation[];
};

const accentByKind: Record<Operation["kind"], string> = {
  add: "border-teal-300/40 bg-teal-300/12",
  subtract: "border-sky-300/40 bg-sky-300/12",
  multiply: "border-amber-300/40 bg-amber-300/12",
  divide: "border-rose-300/40 bg-rose-300/12"
};

export function OperationGrid({ operations }: Props) {
  if (operations.length === 0) {
    return (
      <section className="grid grid-cols-2 gap-2">
        {["Sube poco", "Baja poco", "Sube mucho", "Baja mucho"].map((label) => (
          <div key={label} className="min-h-24 rounded-lg border border-white/10 bg-white/7 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{label}</p>
            <p className="mt-2 text-3xl font-black leading-none text-white sm:text-4xl">...</p>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-2">
      {operations.map((operation) => (
        <div
          key={operation.id}
          className={`min-h-24 rounded-lg border p-3 ${accentByKind[operation.kind]}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
            {actionLabel(operation.action)}
          </p>
          <p className="mt-2 text-3xl font-black leading-none text-white sm:text-4xl">
            {operation.label}
          </p>
        </div>
      ))}
    </section>
  );
}
