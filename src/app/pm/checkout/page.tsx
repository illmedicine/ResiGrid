import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { PropertyCheckoutForm } from "@/components/pm/PropertyCheckoutForm";

export default function PMCheckoutPage() {
  return (
    <div
      className="relative flex flex-1 items-start justify-center px-4 py-10"
      style={{
        backgroundImage: `linear-gradient(rgba(11,31,58,0.88), rgba(11,31,58,0.88)),
          url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "calc(100vh - 72px)",
      }}
    >
      <WatermarkLogo size={520} opacity={0.06} />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
            Property Manager Activation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-orange-400 md:text-3xl">
            Activate your property on ResiGrid
          </h1>
          <p className="mt-2 text-sm text-white/70">
            One-time fee · No subscriptions · Add more properties anytime
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
          <PropertyCheckoutForm />
        </div>
      </div>
    </div>
  );
}
