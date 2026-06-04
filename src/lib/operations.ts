import type {
  GameSettings,
  MovementAction,
  Operation,
  OperationKind,
  Range
} from "@/types/game";

const actionByKind: Record<OperationKind, MovementAction> = {
  add: "smallUp",
  subtract: "smallDown",
  multiply: "bigUp",
  divide: "bigDown"
};

const symbolByKind: Record<OperationKind, string> = {
  add: "+",
  subtract: "-",
  multiply: "x",
  divide: "÷"
};

const UNIQUE_RETRY_LIMIT = 40;

function randomInt({ min, max }: Range) {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function operationParts(kind: OperationKind, settings: GameSettings) {
  const range = settings.operations[kind];
  const a = randomInt(range);
  const b = randomInt(range);

  if (kind === "add") return { left: a, right: b, answer: a + b };
  if (kind === "subtract") {
    const left = Math.max(a, b);
    const right = Math.min(a, b);
    return { left, right, answer: left - right };
  }
  if (kind === "multiply") return { left: a, right: b, answer: a * b };

  const divisor = Math.max(1, b);
  const answer = Math.max(1, a);
  return { left: divisor * answer, right: divisor, answer };
}

export function createOperation(kind: OperationKind, settings: GameSettings): Operation {
  const parts = operationParts(kind, settings);

  return operationFromParts(kind, parts);
}

export function createUniqueOperation(
  kind: OperationKind,
  settings: GameSettings,
  existingAnswers: Set<number>
): Operation {
  for (let attempt = 0; attempt < UNIQUE_RETRY_LIMIT; attempt += 1) {
    const operation = createOperation(kind, settings);
    if (!existingAnswers.has(operation.answer)) {
      return operation;
    }
  }

  return createFallbackOperation(kind, existingAnswers);
}

function operationFromParts(
  kind: OperationKind,
  parts: { left: number; right: number; answer: number }
): Operation {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind,
    action: actionByKind[kind],
    label: `${parts.left} ${symbolByKind[kind]} ${parts.right}`,
    answer: parts.answer
  };
}

function createFallbackOperation(kind: OperationKind, existingAnswers: Set<number>): Operation {
  let answer = Math.max(2, ...Array.from(existingAnswers)) + 1;
  while (existingAnswers.has(answer)) {
    answer += 1;
  }

  if (kind === "add") {
    return operationFromParts(kind, { left: answer - 1, right: 1, answer });
  }

  if (kind === "subtract") {
    return operationFromParts(kind, { left: answer + 1, right: 1, answer });
  }

  if (kind === "multiply") {
    return operationFromParts(kind, { left: answer, right: 1, answer });
  }

  return operationFromParts(kind, { left: answer, right: 1, answer });
}

export function createOperationSet(settings: GameSettings): Operation[] {
  const existingAnswers = new Set<number>();

  return (["add", "subtract", "multiply", "divide"] as OperationKind[]).map((kind) => {
    const operation = createUniqueOperation(kind, settings, existingAnswers);
    existingAnswers.add(operation.answer);
    return operation;
  });
}

export function actionLabel(action: MovementAction) {
  const labels: Record<MovementAction, string> = {
    smallUp: "Sube poco",
    smallDown: "Baja poco",
    bigUp: "Sube mucho",
    bigDown: "Baja mucho"
  };

  return labels[action];
}
