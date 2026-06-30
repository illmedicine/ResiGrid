"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/hooks";
import type { UserRole } from "@/lib/types/models";

const schema = z
  .object({
    displayName: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["tenant", "property_manager"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, userDoc } = useAuth();
  const defaultRole = (params.get("role") as UserRole) ?? "tenant";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const role = watch("role");

  function routeForRole(r: UserRole) {
    const pendingClaim = sessionStorage.getItem("resigrid_pending_claim");
    if (pendingClaim && r === "property_manager") {
      sessionStorage.removeItem("resigrid_pending_claim");
      router.push(`/claim/?token=${pendingClaim}`);
      return;
    }
    router.push(r === "tenant" ? "/tenant/dashboard" : "/pm/dashboard");
  }

  // Handles the redirect return from signInWithGoogle — once auth state
  // resolves after coming back from Google OAuth, route to the portal.
  useEffect(() => {
    if (!user || !userDoc) return;
    routeForRole(userDoc.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userDoc]);

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      await signUpWithEmail(
        values.email,
        values.password,
        values.role,
        values.displayName,
      );
      routeForRole(values.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setSubmitting(false);
    }
  }

  function handleGoogle() {
    setError(null);
    setSubmitting(true);
    // Navigates away — browser returns here after Google OAuth and the
    // useEffect above handles routing once auth state resolves.
    signInWithGoogle(role);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Select label="I am a…" {...register("role")}>
        <option value="tenant">Tenant</option>
        <option value="property_manager">Property Manager</option>
      </Select>

      <Input
        label="Full name"
        autoComplete="name"
        {...register("displayName")}
        error={errors.displayName?.message}
      />
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
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating account…" : "Create account"}
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
