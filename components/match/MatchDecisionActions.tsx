'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type MatchDecisionActionsProps = {
  matchId: string;
};

export function MatchDecisionActions({ matchId }: MatchDecisionActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<'accepted' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: 'accepted' | 'rejected') => {
    setError(null);
    setIsSubmitting(decision);

    const response = await fetch('/api/matching/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, decision }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || 'Unable to record your decision.');
      setIsSubmitting(null);
      return;
    }

    router.refresh();
  };

  return (
    <div>
      <div className="flex gap-2">
        <Button type="button" size="md" className="flex-1" disabled={isSubmitting !== null} onClick={() => decide('accepted')}>
          {isSubmitting === 'accepted' ? 'Accepting…' : 'Accept'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="flex-1"
          disabled={isSubmitting !== null}
          onClick={() => decide('rejected')}
        >
          {isSubmitting === 'rejected' ? 'Declining…' : 'Decline'}
        </Button>
      </div>
      {error ? <p className="mt-2 text-[12px] text-app-red" role="alert">{error}</p> : null}
    </div>
  );
}
