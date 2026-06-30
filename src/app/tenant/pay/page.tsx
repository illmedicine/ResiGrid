import { Card, CardContent } from "@/components/ui/Card";
import { PayRentForm } from "@/components/tenant/PayRentForm";

export default function TenantPayPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Pay rent</h1>
        <p className="text-sm text-neutral-600">
          Pay your landlord directly, even if they don&apos;t use ResiGrid.
        </p>
      </div>
      <Card className="p-5">
        <CardContent className="p-0">
          <PayRentForm />
        </CardContent>
      </Card>
    </div>
  );
}
