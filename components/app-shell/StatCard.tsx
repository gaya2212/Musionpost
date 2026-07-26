import type { RemixiconComponentType } from '@remixicon/react';

type StatCardProps = {
  value: string;
  label: string;
  delta?: string;
  icon: RemixiconComponentType;
  color: string;
};

export function StatCard({ value, label, delta, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-app-xl border border-app-border bg-app-surface p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-medium text-app-fg-2">{label}</div>
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-app-md" style={{ background: `${color}18` }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <div className="text-[28px] font-bold leading-none text-app-fg-1">{value}</div>
      {delta ? <div className="text-[11px] font-semibold text-app-green">↑ {delta}</div> : null}
    </div>
  );
}
