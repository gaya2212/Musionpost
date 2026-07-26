'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/Switch';

type VerificationOptInToggleProps = {
  profileId: string;
  initialOptIn: boolean;
};

export function VerificationOptInToggle({ profileId, initialOptIn }: VerificationOptInToggleProps) {
  const router = useRouter();
  const [optIn, setOptIn] = useState(initialOptIn);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (checked: boolean) => {
    setOptIn(checked);
    setError(null);
    setIsSaving(true);

    const client = createClient();
    if (!client) {
      setError('Supabase is not configured for this environment.');
      setIsSaving(false);
      setOptIn(!checked);
      return;
    }

    const { error: updateError } = await client
      .from('pro_profiles')
      .update({ verification_opt_in: checked })
      .eq('profile_id', profileId);

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message || 'Unable to save your preference.');
      setOptIn(!checked);
      return;
    }

    router.refresh();
  };

  return (
    <div>
      <Switch
        checked={optIn}
        onChange={(e) => handleChange(e.target.checked)}
        disabled={isSaving}
        label="Join the Musion Verified review queue"
        description="We'll consider your completed projects for a Verified by Musion credential."
      />
      {error ? <p className="mt-2 text-[12px] text-app-red" role="alert">{error}</p> : null}
    </div>
  );
}
