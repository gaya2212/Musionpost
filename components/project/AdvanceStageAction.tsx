'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STAGES, STAGE_LABELS, type Stage } from '@/lib/workflow/stages';
import { canTransition, type ProjectStage } from '@/lib/workflow/state-machine';
import { Button } from '@/components/ui/Button';

type AdvanceStageActionProps = {
  projectId: string;
  currentStage: Stage;
  stages: ProjectStage[];
};

export function AdvanceStageAction({ projectId, currentStage, stages }: AdvanceStageActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = STAGES.indexOf(currentStage);
  const nextStage = STAGES[currentIndex + 1];

  if (!nextStage) {
    return (
      <p className="rounded-app-md border border-app-border bg-app-surface-2 px-4 py-3 text-[13px] text-app-fg-2">
        This project has moved through every stage of the workflow.
      </p>
    );
  }

  const handleAdvance = async () => {
    setError(null);

    // The UI never writes current_stage directly — the state machine
    // decides whether this move is legal before anything is persisted.
    const result = canTransition(currentStage, nextStage, stages);

    if (!result.ok) {
      setError(result.reason || 'That move is not allowed yet.');
      return;
    }

    setIsSubmitting(true);

    const client = createClient();
    if (!client) {
      setError('Supabase is not configured for this environment.');
      setIsSubmitting(false);
      return;
    }

    const now = new Date().toISOString();

    const { error: completeError } = await client
      .from('project_stages')
      .update({ status: 'completed', completed_at: now })
      .eq('project_id', projectId)
      .eq('stage', currentStage);

    if (completeError) {
      setError(completeError.message || 'Unable to update the current stage.');
      setIsSubmitting(false);
      return;
    }

    const { error: nextError } = await client
      .from('project_stages')
      .update({ status: 'in_progress', started_at: now })
      .eq('project_id', projectId)
      .eq('stage', nextStage);

    if (nextError) {
      setError(nextError.message || 'Unable to start the next stage.');
      setIsSubmitting(false);
      return;
    }

    const { error: projectError } = await client
      .from('projects')
      .update({ current_stage: nextStage, stage_started_at: now })
      .eq('id', projectId);

    if (projectError) {
      setError(projectError.message || 'Unable to advance the project.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div>
      <Button type="button" size="lg" onClick={handleAdvance} disabled={isSubmitting}>
        {isSubmitting ? 'Moving to next stage…' : `Mark complete and move to ${STAGE_LABELS[nextStage]}`}
      </Button>
      {error ? (
        <p className="mt-3 rounded-app-md border border-app-red/30 bg-app-red/10 px-4 py-3 text-[13px] text-app-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
