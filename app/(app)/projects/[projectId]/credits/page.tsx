import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildCreditsPayload } from '@/lib/credits/export';
import { Badge } from '@/components/ui/Badge';
import { QueueCreditsExportAction } from '@/components/project/QueueCreditsExportAction';

const exportStatusTone: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  pending: 'yellow',
  exported: 'green',
  failed: 'red',
};

export default async function ProjectCreditsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const profile = await requireRole('artist');
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', projectId)
    .eq('artist_profile_id', profile.id)
    .single();

  if (!project) {
    notFound();
  }

  const payload = await buildCreditsPayload(supabase, projectId);

  const { data: exportRows } = await supabase
    .from('credits_export')
    .select('id, status, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  const latestExport = exportRows?.[0];

  return (
    <main className="mx-auto max-w-3xl px-8 py-7">
      <Link href={`/projects/${projectId}`} className="text-[13px] font-medium text-app-primary transition hover:text-app-primary-hover">
        ← Back to {project.title}
      </Link>

      <div className="mt-4 mb-6">
        <div className="text-xl font-bold text-app-fg-1">Credits</div>
        <div className="mt-0.5 text-[13px] text-app-fg-2">
          Preview how this project&apos;s credits will export to Credits.fm.
        </div>
      </div>

      {latestExport ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-app-xl border border-app-border bg-app-surface p-5">
          <span className="text-[13px] text-app-fg-2">Last queued {new Date(latestExport.created_at).toLocaleDateString()}:</span>
          <Badge tone={exportStatusTone[latestExport.status] ?? 'gray'} className="capitalize">
            {latestExport.status}
          </Badge>
        </div>
      ) : null}

      <div className="rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm">
        <dl className="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <dt className="text-app-fg-3">ISRC</dt>
            <dd className="mt-0.5 text-app-fg-1">{payload.isrc ?? 'Not yet assigned'}</dd>
          </div>
          <div>
            <dt className="text-app-fg-3">ISWC</dt>
            <dd className="mt-0.5 text-app-fg-1">{payload.iswc ?? 'Not yet assigned'}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-app-border pt-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Contributors</div>
          {payload.contributors.length === 0 ? (
            <p className="text-[13px] text-app-fg-2">
              No accepted or completed collaborators yet — credits populate once collaborators join a stage.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {payload.contributors.map((contributor) => (
                <div key={contributor.profileId} className="flex items-center justify-between rounded-app-md border border-app-border p-3.5">
                  <div>
                    <div className="text-[13px] font-semibold text-app-fg-1">{contributor.displayName}</div>
                    <div className="text-[12px] text-app-fg-2 capitalize">{contributor.role.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="text-[12px] text-app-fg-3">IPI: {contributor.ipi ?? '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-app-border pt-5">
          <QueueCreditsExportAction projectId={projectId} />
        </div>
      </div>
    </main>
  );
}
