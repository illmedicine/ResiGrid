import { Suspense } from "react";
import Link from "next/link";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { Card, CardContent } from "@/components/ui/Card";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6">
          <CardContent className="p-0">
            <h1 className="mb-1 text-xl font-bold text-navy-900">
              Create your account
            </h1>
            <p className="mb-6 text-sm text-neutral-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-orange-600">
                Log in
              </Link>
            </p>
            <Suspense>
              <SignupForm />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
