import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';

type ProjectCardProps = {
  id: string;
  title: string;
  stageLabel: string;
  stageColor: string;
  progress: number;
  collaboratorNames?: string[];
};

export function ProjectCard({ id, title, stageLabel, stageColor, progress, collaboratorNames = [] }: ProjectCardProps) {
  const collaborators = collaboratorNames.length;
  return (
    <Link
      href={`/projects/${id}`}
      className="block rounded-app-xl border border-app-border bg-app-surface p-5 shadow-app-sm transition hover:border-app-primary hover:shadow-app-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-app-fg-1">{title}</div>
        <span
          className="shrink-0 rounded-app-pill px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: `${stageColor}18`, color: stageColor }}
        >
          {stageLabel}
        </span>
      </div>

      <div className="mb-2.5">
        <div className="mb-1 flex justify-between">
          <span className="text-[11px] text-app-fg-2">Progress</span>
          <span className="text-[11px] font-semibold" style={{ color: stageColor }}>
            {progress}%
          </span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-app-pill bg-app-surface-2">
          <div
            className="h-full rounded-app-pill transition-[width] duration-500"
            style={{ width: `${progress}%`, background: stageColor }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex">
          {collaboratorNames.slice(0, 4).map((name, i) => (
            <div key={name + i} className="rounded-full border-2 border-app-surface" style={{ marginLeft: i ? -6 : 0 }}>
              <Avatar name={name} size="xs" />
            </div>
          ))}
        </div>
        <span className="text-[11px] text-app-fg-3">
          {collaborators} collaborator{collaborators !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}
