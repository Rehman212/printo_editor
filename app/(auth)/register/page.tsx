"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { registerSchema } from "@/schemas/forms";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import type { z } from "zod";

type Form = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<Form>({ resolver: zodResolver(registerSchema) });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const user = await authService.register(values.name, values.email, values.password);
            setUser(user);
            router.push("/account");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not register");
          }
        })}
      >
        <div>
          <Label>Name</Label>
          <Input {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
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
          Register
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Already have an account?{" "}
        <Link className="font-medium text-blue-700" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
