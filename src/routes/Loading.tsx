// src/routes/Loading.tsx

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-light-bg)]">
      <div className="w-6 h-6 border-2 border-[var(--color-light-border)] border-t-[var(--color-light-text)] rounded-full animate-spin" />
    </div>
  );
}
