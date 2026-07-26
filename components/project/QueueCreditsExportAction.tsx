'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type QueueCreditsExportActionProps = {
  projectId: string;
};

export function QueueCreditsExportAction({ projectId }: QueueCreditsExportActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleQueue = async () => {
    setStatus(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/projects/${projectId}/credits`, { method: 'POST' });
    const result = await response.json().catch(() => null);

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus({ type: 'error', text: result?.error || 'Unable to queue this export.' });
      return;
    }

    setStatus({ type: 'success', text: 'Queued for Credits.fm export.' });
    router.refresh();
  };

  return (
    <div>
      <Button type="button" onClick={handleQueue} disabled={isSubmitting}>
        {isSubmitting ? 'Queuing…' : 'Queue for Credits.fm export'}
      </Button>
      {status ? (
        <p className={`mt-2 text-[12px] ${status.type === 'success' ? 'text-app-green' : 'text-app-red'}`} role="alert">
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
