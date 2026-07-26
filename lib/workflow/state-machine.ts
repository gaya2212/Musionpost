import { STAGES, STAGE_LABELS, type Stage } from './stages';

export type ProjectStageStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export type ProjectStage = {
  stage: Stage;
  status: ProjectStageStatus;
};

/**
 * Pure transition check: no DB access. Stages can be advanced in order,
 * skipped, or revisited once already touched. Moving into a stage that
 * hasn't been started yet requires every earlier stage to be completed
 * or skipped first — no skipping ahead over untouched stages.
 */
export function canTransition(
  from: Stage | null,
  to: Stage,
  currentStages: ProjectStage[],
): { ok: boolean; reason?: string } {
  if (from === null) {
    if (to !== STAGES[0]) {
      return { ok: false, reason: `A project must start at ${STAGE_LABELS[STAGES[0]]}.` };
    }
    return { ok: true };
  }

  const statusOf = (stage: Stage): ProjectStageStatus =>
    currentStages.find((s) => s.stage === stage)?.status ?? 'not_started';

  // Revisiting a stage that's already been touched is always allowed.
  const toStatus = statusOf(to);
  if (toStatus === 'completed' || toStatus === 'skipped' || toStatus === 'in_progress') {
    return { ok: true };
  }

  const fromIndex = STAGES.indexOf(from);
  const toIndex = STAGES.indexOf(to);

  // Advancing to the immediate next stage completes `from` as part of the
  // same move — that's the normal "mark complete and continue" action, and
  // it's always legal regardless of whether `from` has been marked
  // complete yet (that's what this transition is for).
  if (toIndex === fromIndex + 1) {
    return { ok: true };
  }

  // Anything further ahead is a skip: every stage up to and including
  // `from` must already be completed or skipped first.
  const blockedBy = STAGES.slice(0, toIndex).find((stage) => {
    const status = statusOf(stage);
    return status !== 'completed' && status !== 'skipped';
  });

  if (blockedBy) {
    return {
      ok: false,
      reason: `Mark ${STAGE_LABELS[blockedBy]} complete or skipped before moving to ${STAGE_LABELS[to]}.`,
    };
  }

  return { ok: true };
}

/** Percentage of the six stages marked completed or skipped, rounded to the nearest integer. */
export function computeProgress(currentStages: ProjectStage[]): number {
  const resolved = currentStages.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  return Math.round((resolved / STAGES.length) * 100);
}
