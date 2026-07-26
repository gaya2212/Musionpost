'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { projectSchema, type ProjectFormValues } from '@/lib/validation/project';
import { STAGES } from '@/lib/workflow/stages';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

type FormState = {
  title: string;
  workingTitle: string;
  description: string;
  targetCompletionDate: string;
};

const initialState: FormState = {
  title: '',
  workingTitle: '',
  description: '',
  targetCompletionDate: '',
};

type FieldErrors = Partial<Record<keyof ProjectFormValues, string>>;

const labelClass = 'mb-1.5 block text-[13px] font-medium text-app-fg-1';
const errorClass = 'mt-1.5 text-[12px] text-app-red';

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsed = projectSchema.safeParse(form);

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
        ) as FieldErrors,
      );
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const client = createClient();

    if (!client) {
      setFormError('Supabase is not configured for this environment.');
      setIsSubmitting(false);
      return;
    }

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      setFormError('Your session has expired. Please sign in again.');
      setIsSubmitting(false);
      return;
    }

    const { data: project, error: projectError } = await client
      .from('projects')
      .insert({
        artist_profile_id: user.id,
        title: parsed.data.title,
        working_title: parsed.data.workingTitle || null,
        description: parsed.data.description || null,
        target_completion_date: parsed.data.targetCompletionDate || null,
        current_stage: STAGES[0],
      })
      .select('id')
      .single();

    if (projectError || !project) {
      setFormError(projectError?.message || 'Unable to create the project. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const { error: stagesError } = await client.from('project_stages').insert(
      STAGES.map((stage) => ({
        project_id: project.id,
        stage,
        status: stage === STAGES[0] ? 'in_progress' : 'not_started',
        started_at: stage === STAGES[0] ? new Date().toISOString() : null,
      })),
    );

    if (stagesError) {
      // Best-effort compensation: don't leave a project with no stage rows.
      await client.from('projects').delete().eq('id', project.id);
      setFormError(stagesError.message || 'Unable to set up the project stages. Please try again.');
      setIsSubmitting(false);
      return;
    }

    router.push(`/projects/${project.id}`);
  };

  return (
    <main className="mx-auto max-w-2xl px-8 py-7">
      <Link href="/projects" className="text-[13px] font-medium text-app-primary transition hover:text-app-primary-hover">
        ← Back to projects
      </Link>

      <div className="mt-4 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm sm:p-8">
        <div className="text-xl font-bold text-app-fg-1">Start a new project</div>
        <p className="mt-1 text-[13px] text-app-fg-2">Every project moves through the same six-stage workflow.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="The name of the release"
              error={Boolean(fieldErrors.title)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'title-error' : undefined}
            />
            {fieldErrors.title ? (
              <p id="title-error" className={errorClass} aria-live="polite">
                {fieldErrors.title}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="workingTitle" className={labelClass}>
              Working title
            </label>
            <Input
              id="workingTitle"
              value={form.workingTitle}
              onChange={(event) => updateField('workingTitle', event.target.value)}
              placeholder="Optional, if it's different from the title"
              error={Boolean(fieldErrors.workingTitle)}
              aria-invalid={Boolean(fieldErrors.workingTitle)}
              aria-describedby={fieldErrors.workingTitle ? 'workingTitle-error' : undefined}
            />
            {fieldErrors.workingTitle ? (
              <p id="workingTitle-error" className={errorClass} aria-live="polite">
                {fieldErrors.workingTitle}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <div className="relative">
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="What this project is and where it's headed"
                className="min-h-32 pb-6"
                maxLength={4000}
                error={Boolean(fieldErrors.description)}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'description-error' : undefined}
              />
              <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[11px] text-app-fg-3">
                {form.description.length}/4000
              </span>
            </div>
            {fieldErrors.description ? (
              <p id="description-error" className={errorClass} aria-live="polite">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="targetCompletionDate" className={labelClass}>
              Target completion date
            </label>
            <Input
              id="targetCompletionDate"
              type="date"
              value={form.targetCompletionDate}
              onChange={(event) => updateField('targetCompletionDate', event.target.value)}
              error={Boolean(fieldErrors.targetCompletionDate)}
              aria-invalid={Boolean(fieldErrors.targetCompletionDate)}
              aria-describedby={fieldErrors.targetCompletionDate ? 'targetCompletionDate-error' : undefined}
            />
            {fieldErrors.targetCompletionDate ? (
              <p id="targetCompletionDate-error" className={errorClass} aria-live="polite">
                {fieldErrors.targetCompletionDate}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-app-md border border-app-red/30 bg-app-red/10 px-4 py-3 text-[13px] text-app-red" role="alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating project…' : 'Create project'}
          </Button>
        </form>
      </div>
    </main>
  );
}
