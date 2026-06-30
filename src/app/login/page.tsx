import Link from "next/link";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { Card, CardContent } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6">
          <CardContent className="p-0">
            <h1 className="mb-1 text-xl font-bold text-navy-900">
              Welcome back
            </h1>
            <p className="mb-6 text-sm text-neutral-600">
              New to ResiGrid?{" "}
              <Link href="/signup" className="font-medium text-orange-600">
                Create an account
              </Link>
            </p>
            <LoginForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
