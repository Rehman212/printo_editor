"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { resetSchema } from "@/schemas/forms";
import type { z } from "zod";

export default function ResetPasswordPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(() => {
          toast.success("Password updated in the frontend MVP.");
          router.push("/login");
        })}
      >
        <div>
          <Label>Password</Label>
          <Input type="password" {...form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div>
          <Label>Confirm password</Label>
          <Input type="password" {...form.register("confirmPassword")} />
          <FieldError message={form.formState.errors.confirmPassword?.message} />
        </div>
        <Button className="w-full">Update password</Button>
      </form>
    </div>
  );
}
