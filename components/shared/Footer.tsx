export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-canvas-black/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-400 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <p>© 2026 Musion. Structured workflow, real people.</p>
        <div className="flex gap-4">
          <a href="#waitlist" className="transition hover:text-white">
            Join the waitlist
          </a>
          <a href="#workflow" className="transition hover:text-white">
            See the workflow
          </a>
        </div>
      </div>
    </footer>
  );
}
