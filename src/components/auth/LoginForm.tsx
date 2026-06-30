"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { db } from "@/lib/firebase/config";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import type { UserDoc } from "@/lib/types/models";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function routeByRole(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    const role = snap.exists() ? (snap.data() as UserDoc).role : "tenant";

    const pendingClaim = sessionStorage.getItem("resigrid_pending_claim");
    if (pendingClaim && role === "property_manager") {
      sessionStorage.removeItem("resigrid_pending_claim");
      router.push(`/claim/?token=${pendingClaim}`);
      return;
    }
    router.push(role === "tenant" ? "/tenant/dashboard" : "/pm/dashboard");
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const user = await signInWithEmail(values.email, values.password);
      await routeByRole(user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      // Existing users keep their stored role; new Google sign-ins default to tenant.
      const user = await signInWithGoogle("tenant");
      await routeByRole(user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        {...register("password")}
        error={errors.password?.message}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        Log in
      </Button>

      <div className="flex items-center gap-3 text-xs text-neutral-600">
        <span className="h-px flex-1 bg-neutral-200" />
        or
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={submitting}
        onClick={handleGoogle}
        className="w-full"
      >
        Continue with Google
      </Button>
    </form>
  );
}
