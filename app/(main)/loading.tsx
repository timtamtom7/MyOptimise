export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-3xl bg-card px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/70" />
        <div className="text-sm text-foreground/80">Loading…</div>
      </div>
    </div>
  );
}

