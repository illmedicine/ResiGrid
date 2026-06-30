import { PublicNavBar } from "@/components/layout/PublicNavBar";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:px-8">
        <h1 className="mb-2 text-2xl font-bold text-navy-900">Privacy Policy</h1>
        <p className="mb-8 text-sm text-neutral-600">Last updated June 30, 2026</p>

        <Section title="1. Information we collect">
          ResiGrid collects information you provide when creating an account
          (name, email, phone), payment details processed through Square (we
          never store raw card numbers), rental history, and communications
          within the platform.
        </Section>

        <Section title="2. How we use your information">
          We use your data to operate the platform — processing rent payments,
          calculating your reputation score, connecting tenants with property
          managers, and providing maintenance request tracking. We do not sell
          your personal data to third parties.
        </Section>

        <Section title="3. Payment data">
          All card payments are processed by Square. ResiGrid stores only
          payment status, amounts, and timing information needed to calculate
          on-time payment reputation scores. Raw card data never touches our
          servers.
        </Section>

        <Section title="4. Data sharing">
          Your reputation score and badge history are visible to property
          managers on ResiGrid when you apply to their listings. No other
          personal information is shared without your consent.
        </Section>

        <Section title="5. Data retention">
          Account data is retained for as long as your account is active.
          You may request deletion by contacting us at the address below.
        </Section>

        <Section title="6. Contact">
          Questions about this policy? Contact us at{" "}
          <a
            href="https://www.illyrobotic-ai.com/"
            className="font-medium text-orange-600 hover:underline"
          >
            Illy Robotic Instruments
          </a>{" "}
          or email privacy@resigrid.co.
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-base font-semibold text-navy-900">{title}</h2>
      <p className="text-sm leading-relaxed text-neutral-600">{children}</p>
    </section>
  );
}
