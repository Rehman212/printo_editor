import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-2xl font-semibold text-white">
          Printo
        </Link>
        <div className="rounded-3xl bg-white p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
