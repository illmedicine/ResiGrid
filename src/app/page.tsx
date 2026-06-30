import Link from "next/link";
import {
  Banknote,
  KeyRound,
  MessageSquareLock,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { Card, CardContent } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />

      <section className="bg-navy-900 px-4 py-14 text-center md:py-20">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold text-white md:text-5xl">
          Rent payments, reputation, and property management — in one place.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 md:text-base">
          ResiGrid lets tenants pay rent — even to landlords who aren&apos;t on
          the platform — while building a payment history that follows them
          from lease to lease.
        </p>
      </section>

      <section className="mx-auto -mt-8 grid w-full max-w-4xl gap-4 px-4 pb-12 sm:grid-cols-2 md:-mt-10">
        <Link href="/signup?role=tenant" className="block">
          <Card className="h-full p-6 transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <span className="rounded-full bg-orange-100 p-3 text-orange-600">
                <KeyRound className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-semibold text-navy-900">
                I&apos;m a Tenant
              </h2>
              <p className="text-sm text-neutral-600">
                Pay rent, search for apartments, submit maintenance requests,
                and build your rent payment reputation.
              </p>
              <span className="mt-2 text-sm font-medium text-orange-600">
                Get started →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/signup?role=property_manager" className="block">
          <Card className="h-full p-6 transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <span className="rounded-full bg-navy-900/10 p-3 text-navy-900">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-semibold text-navy-900">
                I&apos;m a Property Manager
              </h2>
              <p className="text-sm text-neutral-600">
                Manage properties, units, leases, and tenants — collect
                payments and screen applicants by reputation score.
              </p>
              <span className="mt-2 text-sm font-medium text-orange-600">
                Get started →
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 pb-16 sm:grid-cols-2 md:grid-cols-4">
        <Feature
          icon={Banknote}
          title="Pay anyone"
          description="Pay rent by card even if your landlord isn't on ResiGrid — they claim it via a secure voucher link."
        />
        <Feature
          icon={ShieldCheck}
          title="Reputation & badges"
          description="On-time payment history and badges that property managers can see when you apply."
        />
        <Feature
          icon={Wrench}
          title="Maintenance requests"
          description="Submit and track maintenance requests for your unit, by room or appliance."
        />
        <Feature
          icon={MessageSquareLock}
          title="Secure messaging"
          description="Message your landlord or tenant directly, saved and encrypted in the platform."
        />
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Banknote;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="rounded-lg bg-navy-900/5 p-2 text-navy-900">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      <p className="text-xs text-neutral-600">{description}</p>
    </div>
  );
}
