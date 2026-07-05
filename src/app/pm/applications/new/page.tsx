import { ApplicationBuilderForm } from "@/components/pm/ApplicationBuilderForm";

export default function NewApplicationPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Create Application</h1>
        <p className="text-sm text-neutral-600">
          Log an application directly for a registered tenant — useful for paper
          applications or tenants you&apos;re fast-tracking outside the listing flow.
        </p>
      </div>
      <ApplicationBuilderForm />
    </div>
  );
}
