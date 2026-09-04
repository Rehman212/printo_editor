"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { loginSchema } from "@/schemas/forms";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import type { z } from "zod";

type Form = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<Form>({ resolver: zodResolver(loginSchema) });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Use the account you registered in this browser.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const user = await authService.login(values.email, values.password);
            setUser(user);
            router.push("/account");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Login failed");
          }
        })}
      >
        <div>
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" {...form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <Button className="w-full" type="submit">
          Continue
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        No account?{" "}
        <Link className="font-medium text-blue-700" href="/register">
          Register
        </Link>
        {" · "}
        <Link className="font-medium text-blue-700" href="/forgot-password">
          Forgot password
        </Link>
      </p>
    </div>
  );
}
