'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STAGES, STAGE_LABELS, type Stage } from '@/lib/workflow/stages';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

type InviteToProjectActionProps = {
  proProfileId: string;
  role: string;
  projects: { id: string; title: string }[];
};

export function InviteToProjectAction({ proProfileId, role, projects }: InviteToProjectActionProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [stage, setStage] = useState<Stage>(STAGES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInvite = async () => {
    if (!projectId) return;
    setStatus(null);
    setIsSubmitting(true);

    const client = createClient();
    if (!client) {
      setStatus({ type: 'error', text: 'Supabase is not configured for this environment.' });
      setIsSubmitting(false);
      return;
    }

    const { error } = await client.from('project_collaborators').insert({
      project_id: projectId,
      pro_profile_id: proProfileId,
      stage,
      role,
      status: 'invited',
    });

    setIsSubmitting(false);

    if (error) {
      setStatus({ type: 'error', text: error.message || 'Unable to send that invite.' });
      return;
    }

    setStatus({ type: 'success', text: 'Invite sent.' });
    router.refresh();
  };

  return (
    <div className="rounded-app-xl border border-app-border bg-app-surface p-5">
      <p className="mb-3 text-[13px] font-semibold text-app-fg-1">Invite to a project</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="flex-1">
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>
        <Select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className="flex-1">
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={handleInvite} disabled={isSubmitting || !projectId}>
          {isSubmitting ? 'Inviting…' : 'Invite'}
        </Button>
      </div>
      {status ? (
        <p className={`mt-2 text-[12px] ${status.type === 'success' ? 'text-app-green' : 'text-app-red'}`} role="alert">
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
