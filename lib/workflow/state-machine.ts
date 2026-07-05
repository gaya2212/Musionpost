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

  // Moving into an untouched stage requires every earlier stage to be
  // completed or skipped first.
  const toIndex = STAGES.indexOf(to);
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
