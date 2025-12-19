export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-background/60">
      <div className="rounded-xl border bg-background px-6 py-4 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="inline-block size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    </div>
  );
}
