'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { Stage } from '@/lib/workflow/stages';

type GenerateMatchesActionProps = {
  projectId: string;
  stage: Stage;
  label?: string;
};

export function GenerateMatchesAction({ projectId, stage, label = 'Find matches for this stage' }: GenerateMatchesActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch('/api/matching/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, stage }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || 'Unable to generate matches right now.');
      return;
    }

    router.refresh();
  };

  return (
    <div>
      <Button type="button" variant="secondary" size="md" onClick={handleGenerate} disabled={isSubmitting}>
        {isSubmitting ? 'Finding matches…' : label}
      </Button>
      {error ? <p className="mt-2 text-[12px] text-app-red" role="alert">{error}</p> : null}
    </div>
  );
}
