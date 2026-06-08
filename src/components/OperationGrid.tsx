"use client";

import { actionLabel } from "@/lib/operations";
import type { Operation, OperationKind } from "@/types/game";

type Props = {
  operations: Operation[];
  compact?: boolean;
  kinds?: OperationKind[];
  gameplay?: boolean;
};

const accentByKind: Record<Operation["kind"], string> = {
  add: "border-teal-300/40 bg-teal-300/12",
  subtract: "border-sky-300/40 bg-sky-300/12",
  multiply: "border-amber-300/40 bg-amber-300/12",
  divide: "border-rose-300/40 bg-rose-300/12"
};

const placeholderByKind: Record<OperationKind, string> = {
  add: "+",
  subtract: "-",
  multiply: "x",
  divide: "÷"
};

const arrowByKind: Record<OperationKind, string> = {
  add: "↑",
  subtract: "↓",
  multiply: "↑↑",
  divide: "↓↓"
};

export function OperationGrid({
  operations,
  compact = false,
  kinds = ["add", "subtract", "multiply", "divide"],
  gameplay = false
}: Props) {
  return (
    <section className={`grid grid-cols-2 ${compact ? "gap-1.5" : "gap-2"}`}>
      {kinds.map((kind) => {
        const operation = operations.find((candidate) => candidate.kind === kind);
        return (
          <OperationTile
            key={operation?.id ?? kind}
            compact={compact}
            gameplay={gameplay}
            kind={kind}
            operation={operation}
          />
        );
      })}
    </section>
  );
}

type TileProps = {
  compact: boolean;
  gameplay: boolean;
  kind: OperationKind;
  operation?: Operation;
};

function OperationTile({ compact, gameplay, kind, operation }: TileProps) {
  const label = operation ? actionLabel(operation.action) : actionLabel(actionFromKind(kind));

  return (
    <div
      className={`${compact ? "min-h-12 p-2" : "min-h-24 p-3"} rounded-lg border ${
        accentByKind[kind]
      }`}
    >
      {gameplay ? (
        <div className="flex h-full items-center gap-2">
          <span className="w-8 shrink-0 text-center text-xl font-black leading-none text-white">
            {arrowByKind[kind]}
          </span>
          <span className="min-w-0 flex-1 text-2xl font-black leading-none text-white">
            {operation?.label ?? placeholderByKind[kind]}
          </span>
        </div>
      ) : (
        <>
          <p className={`${compact ? "text-[10px]" : "text-xs"} font-semibold uppercase tracking-wide text-slate-200`}>
            {label}
          </p>
          <p className={`${compact ? "mt-1 text-xl" : "mt-2 text-3xl sm:text-4xl"} font-black leading-none text-white`}>
            {operation?.label ?? "..."}
          </p>
        </>
      )}
    </div>
  );
}

function actionFromKind(kind: OperationKind) {
  const actions = {
    add: "smallUp",
    subtract: "smallDown",
    multiply: "bigUp",
    divide: "bigDown"
  } as const;

  return actions[kind];
}
