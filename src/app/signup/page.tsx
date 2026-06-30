import { Suspense } from "react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { AuthGate } from "@/components/auth/AuthGate";

// Signup and login are the same flow — just Google SSO with a role hint.
export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <main
        className="relative flex flex-1 items-center justify-center px-4 py-12"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.85), rgba(11,31,58,0.85)),
            url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <WatermarkLogo size={580} opacity={0.07} />
        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl">
          <Suspense>
            <AuthGate />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
