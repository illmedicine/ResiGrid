"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/hooks";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const { user, userDoc } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Handles the redirect return from signInWithGoogle — once auth state
  // resolves after coming back from Google OAuth, route to the portal.
  useEffect(() => {
    if (!user || !userDoc) return;
    const pendingClaim = sessionStorage.getItem("resigrid_pending_claim");
    if (pendingClaim && userDoc.role === "property_manager") {
      sessionStorage.removeItem("resigrid_pending_claim");
      router.push(`/claim/?token=${pendingClaim}`);
      return;
    }
    router.push(userDoc.role === "tenant" ? "/tenant/dashboard" : "/pm/dashboard");
  }, [user, userDoc, router]);

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(values.email, values.password);
      // Routing handled by the useEffect above once userDoc loads.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setSubmitting(false);
    }
  }

  function handleGoogle() {
    setError(null);
    setSubmitting(true);
    // Navigates away — browser returns here after Google OAuth and the
    // useEffect above handles routing once auth state resolves.
    signInWithGoogle("tenant");
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
        {submitting ? "Signing in…" : "Log in"}
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
