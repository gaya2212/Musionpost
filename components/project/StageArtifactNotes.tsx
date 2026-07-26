'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Stage } from '@/lib/workflow/stages';

type StageArtifactNotesProps = {
  projectId: string;
  stage: Stage;
  initialNotes: string;
};

export function StageArtifactNotes({ projectId, stage, initialNotes }: StageArtifactNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setIsSaving(true);

    const client = createClient();
    if (!client) {
      setError('Supabase is not configured for this environment.');
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await client
      .from('project_stages')
      .update({ artifacts: { notes } })
      .eq('project_id', projectId)
      .eq('stage', stage);

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message || 'Unable to save notes.');
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div>
      <Textarea
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setSaved(false);
        }}
        placeholder="Reference tracks, session notes, stem links, whatever this stage needs to hand off cleanly."
        className="min-h-28"
      />
      <div className="mt-2.5 flex items-center gap-3">
        <Button type="button" variant="secondary" size="md" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save notes'}
        </Button>
        {saved ? <span className="text-[12px] text-app-green">Saved.</span> : null}
        {error ? <span className="text-[12px] text-app-red" role="alert">{error}</span> : null}
      </div>
    </div>
  );
}
