"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <PageHeader title="Account" description="Frontend session stored locally until NestJS auth is connected." />
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
        <p className="font-semibold">{user.name}</p>
        <p className="text-slate-500">{user.email}</p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={async () => {
            await authService.logout();
            setUser(null);
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
