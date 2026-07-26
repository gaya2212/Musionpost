'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

type SettingsFormProps = {
  profileId: string;
  initialDisplayName: string;
  initialLocation: string;
  initialBio: string;
  initialVisibility: string;
};

const labelClass = 'mb-1.5 block text-[13px] font-medium text-app-fg-1';

const visibilityOptions = [
  { value: 'public', label: 'Public — visible in Discover and to anyone with the link' },
  { value: 'team_only', label: 'Team only — visible to your project collaborators' },
  { value: 'private', label: 'Private — visible only to you' },
];

export function SettingsForm({
  profileId,
  initialDisplayName,
  initialLocation,
  initialBio,
  initialVisibility,
}: SettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [location, setLocation] = useState(initialLocation);
  const [bio, setBio] = useState(initialBio);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name is required.' });
      return;
    }

    setIsSaving(true);

    const client = createClient();
    if (!client) {
      setMessage({ type: 'error', text: 'Supabase is not configured for this environment.' });
      setIsSaving(false);
      return;
    }

    const { error } = await client
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        location: location.trim() || null,
        bio: bio.trim() || null,
        visibility,
      })
      .eq('id', profileId);

    setIsSaving(false);

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to save your changes.' });
      return;
    }

    setMessage({ type: 'success', text: 'Saved.' });
    router.refresh();
  };

  const handleSignOut = async () => {
    const client = createClient();
    if (!client) return;
    await client.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm">
        <div className="mb-4 text-sm font-semibold text-app-fg-1">Profile</div>

        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className={labelClass}>
              Display name
            </label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div>
            <label htmlFor="location" className={labelClass}>
              Location
            </label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div>
            <label htmlFor="bio" className={labelClass}>
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short line about you and your work."
            />
          </div>

          <div>
            <label htmlFor="visibility" className={labelClass}>
              Profile visibility
            </label>
            <Select id="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {message ? (
          <p
            className={`mt-4 rounded-app-md px-3.5 py-2.5 text-[13px] ${
              message.type === 'success' ? 'bg-app-green/10 text-app-green' : 'bg-app-red/10 text-app-red'
            }`}
            role="alert"
          >
            {message.text}
          </p>
        ) : null}

        <Button type="submit" disabled={isSaving} className="mt-5">
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <div className="rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm">
        <div className="mb-1 text-sm font-semibold text-app-fg-1">Sign out</div>
        <p className="mb-4 text-[13px] text-app-fg-2">You&apos;ll need to sign back in to access your workspace.</p>
        <Button type="button" variant="secondary" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
