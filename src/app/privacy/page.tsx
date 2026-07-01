import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:px-8">
        <h1 className="mb-2 text-2xl font-bold text-navy-900">Privacy Policy</h1>
        <p className="mb-8 text-sm text-neutral-600">Last updated July 1, 2026</p>

        {/* Commitment banner */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-5">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-orange-500" />
          <div>
            <p className="text-sm font-bold text-navy-900">
              ResiGrid will never sell or share your personal data — ever.
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              We collect only what is necessary to operate the platform. Your information
              belongs to you. We do not share it with advertisers, data brokers, marketing
              platforms, or any third party for commercial purposes. This commitment applies
              to all users — tenants, property managers, and visitors.
            </p>
          </div>
        </div>

        <Section title="1. Information we collect">
          ResiGrid collects information you provide when creating an account (name, email,
          phone number), documents you upload as part of a rental application (paystubs,
          bank statements, government ID, utility statements), payment details processed
          through Square (we never store raw card numbers), rental history, communications
          within the platform, and maintenance request photos.
        </Section>

        <Section title="2. How we use your information">
          We use your data solely to operate the ResiGrid platform: processing rent
          payments, calculating your RGE reputation score, connecting tenants with
          property managers through the invite-to-apply process, tracking maintenance
          requests, enabling in-platform messaging, and providing lease management tools.
          We will never use your data for advertising, profiling, or any purpose outside
          of providing you with the ResiGrid service.
        </Section>

        <Section title="3. Application documents and personal information">
          Documents you upload during a rental application (paystubs, bank statements,
          photo ID, utility statements, etc.) are stored securely in Firebase Cloud
          Storage and are accessible only to you and the specific property manager you
          applied to. These documents are never shared with other property managers,
          third parties, or ResiGrid staff except as required by law.
        </Section>

        <Section title="4. Maintenance photos">
          Photos submitted with maintenance requests are stored securely and are visible
          only to the tenant who submitted the request and the property manager for the
          relevant property. They are retained for records and dispute resolution purposes
          and are not shared externally.
        </Section>

        <Section title="5. Payment data">
          All card payments are processed by Square. ResiGrid stores only payment status,
          amounts, and timing information needed to calculate your on-time payment
          reputation score. Raw card data never touches our servers. ACH payment
          information is handled by Square and governed by Square's privacy policy.
        </Section>

        <Section title="6. RGE Reputation Score">
          Your RGE Score and badge history are visible to property managers on ResiGrid
          when you apply to their listings — but only after you choose to engage with that
          listing. Your score is never sold, published publicly, or shared with credit
          bureaus, landlord screening services, or any external party.
        </Section>

        <Section title="7. Data sharing — our firm commitment">
          <strong>ResiGrid does not sell, rent, license, or share your personal
          information</strong> with any third party for commercial purposes. Period. The
          only third parties who may process your data are:
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600">
            <li>
              <strong>Square</strong> — for payment processing only, governed by their
              own privacy policy.
            </li>
            <li>
              <strong>Firebase / Google Cloud</strong> — for secure data storage and
              authentication, under Google's data processing agreements.
            </li>
            <li>
              <strong>Law enforcement</strong> — only when required by a valid legal
              process (court order, subpoena) and to the minimum extent required by law.
            </li>
          </ul>
          We do not use advertising networks, social media pixels, data brokers, or
          behavioral tracking tools.
        </Section>

        <Section title="8. Data retention">
          Account data is retained while your account is active. Application documents
          are retained for a minimum of 12 months for records purposes. You may request
          deletion of your account and associated data at any time by contacting us.
          Certain financial records may be retained longer as required by law.
        </Section>

        <Section title="9. Your rights">
          You have the right to access, correct, or delete your personal information.
          To exercise these rights, contact us at the address below. We will respond
          within 30 days.
        </Section>

        <Section title="10. Children">
          ResiGrid is not directed at children under 18. We do not knowingly collect
          personal information from minors.
        </Section>

        <Section title="11. Changes to this policy">
          If we make material changes to this policy, we will notify users via in-platform
          message and update the date at the top of this page. Continued use of ResiGrid
          after notification constitutes acceptance of the updated policy.
        </Section>

        <Section title="12. Contact">
          Questions or privacy requests? Contact us at{" "}
          <a
            href="https://www.illyrobotic-ai.com/"
            className="font-medium text-orange-600 hover:underline"
          >
            Illy Robotic Instruments
          </a>{" "}
          or email{" "}
          <a href="mailto:privacy@resigrid.co" className="font-medium text-orange-600 hover:underline">
            privacy@resigrid.co
          </a>
          .
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
