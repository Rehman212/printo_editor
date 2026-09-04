"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { forgotSchema } from "@/schemas/forms";
import { authService } from "@/services/auth.service";
import type { z } from "zod";

export default function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-1 text-sm text-slate-500">We will confirm the account exists in this browser store.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await authService.requestReset(values.email);
            toast.success("If this email is registered, you can now set a new password.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Request failed");
          }
        })}
      >
        <div>
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <Button className="w-full">Send reset</Button>
      </form>
    </div>
  );
}
