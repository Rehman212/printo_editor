"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-slate-500">{error.message}</p>
      <button className="rounded-lg bg-slate-950 px-4 py-2 text-white" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
