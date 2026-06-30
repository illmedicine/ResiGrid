import { Suspense } from "react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { AuthGate } from "@/components/auth/AuthGate";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <main
        className="relative flex flex-1 items-center justify-center px-4 py-12"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,58,0.88), rgba(11,31,58,0.88)),
            url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=80')`,
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
