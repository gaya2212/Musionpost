import Link from 'next/link';
import { RiCheckLine } from '@remixicon/react';
import { STAGES, STAGE_LABELS, STAGE_COLORS, type Stage } from '@/lib/workflow/stages';
import type { ProjectStage, ProjectStageStatus } from '@/lib/workflow/state-machine';

type StageTimelineProps = {
  projectId: string;
  currentStage: Stage;
  stages: ProjectStage[];
  /** The stage whose page is currently being viewed, if different from currentStage. */
  viewingStage?: Stage;
};

const statusOf = (stages: ProjectStage[], stage: Stage): ProjectStageStatus =>
  stages.find((s) => s.stage === stage)?.status ?? 'not_started';

export function StageTimeline({ projectId, currentStage, stages, viewingStage }: StageTimelineProps) {
  return (
    <ol className="flex items-start justify-between gap-1">
      {STAGES.map((stage, index) => {
        const status = statusOf(stages, stage);
        const isCurrent = stage === currentStage;
        const isViewing = stage === (viewingStage ?? currentStage);
        const color = STAGE_COLORS[stage];
        const touched = status !== 'not_started';

        return (
          <li key={stage} className="flex flex-1 flex-col items-center text-center">
            <Link href={`/projects/${projectId}/${stage}`} className="flex w-full items-center group">
              <div
                className="h-px flex-1"
                style={{ background: index === 0 ? 'transparent' : touched ? color : 'var(--color-app-border)' }}
              />
              <div
                aria-current={isViewing ? 'step' : undefined}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition group-hover:opacity-80"
                style={
                  status === 'completed'
                    ? { borderColor: color, background: color, color: '#fff' }
                    : status === 'skipped'
                      ? { borderColor: 'var(--color-app-border)', background: 'var(--color-app-surface-2)', color: 'var(--color-app-fg-2)' }
                      : isCurrent
                        ? { borderColor: color, background: 'var(--color-app-surface)', color, boxShadow: `0 0 0 4px ${color}26` }
                        : { borderColor: 'var(--color-app-border)', background: 'var(--color-app-surface)', color: 'var(--color-app-fg-3)' }
                }
              >
                {status === 'completed' ? <RiCheckLine size={16} aria-hidden="true" /> : index + 1}
              </div>
              <div
                className="h-px flex-1"
                style={{
                  background:
                    index === STAGES.length - 1 ? 'transparent' : status === 'completed' ? color : 'var(--color-app-border)',
                }}
              />
            </Link>
            <p
              className="mt-2 text-xs font-medium"
              style={{ color: isViewing ? 'var(--color-app-fg-1)' : 'var(--color-app-fg-3)' }}
            >
              {STAGE_LABELS[stage]}
            </p>
            {status === 'skipped' ? (
              <p className="text-[10px] uppercase tracking-wide text-app-fg-3">Skipped</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
