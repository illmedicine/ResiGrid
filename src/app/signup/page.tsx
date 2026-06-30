import { Suspense } from "react";
import Link from "next/link";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { Card, CardContent } from "@/components/ui/Card";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />

      {/* Full-page area with background image + large watermark logo */}
      <main
        className="relative flex flex-1 items-center justify-center px-4 py-10"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.85), rgba(11,31,58,0.85)),
            url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Large centered watermark behind the form */}
        <WatermarkLogo size={580} opacity={0.07} />

        {/* Form card sits above the watermark */}
        <Card className="relative z-10 w-full max-w-md p-6 shadow-2xl">
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
