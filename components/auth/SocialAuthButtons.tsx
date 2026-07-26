'use client';

import { useState } from 'react';
import { RiAppleFill, RiGoogleFill } from '@remixicon/react';
import { createClient } from '@/lib/supabase/client';
import { buttonClasses } from '@/components/ui/Button';

export function SocialAuthButtons() {
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setError(null);
    const client = createClient();

    if (!client) {
      setError('Supabase is not configured for this environment.');
      return;
    }

    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (oauthError) {
      setError(oauthError.message || `Unable to continue with ${provider === 'apple' ? 'Apple' : 'Google'}.`);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-app-border" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-app-fg-3">Or continue with</span>
        <div className="h-px flex-1 bg-app-border" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => handleOAuth('apple')} className={buttonClasses('secondary', 'lg', 'w-full')}>
          <RiAppleFill size={18} /> Apple
        </button>
        <button type="button" onClick={() => handleOAuth('google')} className={buttonClasses('secondary', 'lg', 'w-full')}>
          <RiGoogleFill size={18} /> Google
        </button>
      </div>

      {error ? <p className="mt-3 text-[12px] text-app-red" role="alert">{error}</p> : null}
    </div>
  );
}
