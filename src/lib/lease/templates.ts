import type {
  LeaseTemplateDoc,
  LeaseTermType,
  LeaseUtilities,
  LeasePets,
  LeaseParking,
} from "@/lib/types/models";

const STANDARD_UTILITIES: LeaseUtilities = {
  gas: "tenant",
  electric: "tenant",
  water: "landlord",
  trash: "landlord",
  internet: "na",
};

const NO_PETS: LeasePets = {
  allowed: false,
  maxCount: 0,
  typesAllowed: "",
  deposit: 0,
  monthlyRent: 0,
};

const PET_FRIENDLY: LeasePets = {
  allowed: true,
  maxCount: 2,
  typesAllowed: "Cats and dogs under 25 lbs",
  deposit: 300,
  monthlyRent: 50,
};

const NO_PARKING: LeaseParking = { type: "none", spaces: 0, monthlyFee: 0 };
const INCLUDED_PARKING: LeaseParking = { type: "included", spaces: 1, monthlyFee: 0 };

type BuiltinTemplate = Omit<LeaseTemplateDoc, "id" | "pmId" | "createdAt">;

export const BUILTIN_TEMPLATES: Record<string, BuiltinTemplate> = {
  "12-month": {
    name: "12-Month Standard",
    termType: "12-month" as LeaseTermType,
    securityDepositMultiplier: 1,
    moveInFee: 0,
    lateFeeDays: 5,
    lateFeeAmount: 50,
    utilities: STANDARD_UTILITIES,
    pets: NO_PETS,
    parking: NO_PARKING,
    smokingAllowed: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    additionalTerms: "",
  },
  "24-month": {
    name: "24-Month Stability",
    termType: "24-month" as LeaseTermType,
    securityDepositMultiplier: 1,
    moveInFee: 0,
    lateFeeDays: 5,
    lateFeeAmount: 50,
    utilities: STANDARD_UTILITIES,
    pets: NO_PETS,
    parking: INCLUDED_PARKING,
    smokingAllowed: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    additionalTerms: "Tenant agrees to provide 60 days written notice prior to vacating.",
  },
  "month-to-month": {
    name: "Month-to-Month Flexible",
    termType: "month-to-month" as LeaseTermType,
    securityDepositMultiplier: 1.5,
    moveInFee: 0,
    lateFeeDays: 3,
    lateFeeAmount: 75,
    utilities: STANDARD_UTILITIES,
    pets: NO_PETS,
    parking: NO_PARKING,
    smokingAllowed: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    additionalTerms: "Either party may terminate with 30 days written notice.",
  },
  "pet-friendly-12": {
    name: "12-Month Pet-Friendly",
    termType: "12-month" as LeaseTermType,
    securityDepositMultiplier: 1.5,
    moveInFee: 0,
    lateFeeDays: 5,
    lateFeeAmount: 50,
    utilities: STANDARD_UTILITIES,
    pets: PET_FRIENDLY,
    parking: NO_PARKING,
    smokingAllowed: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    additionalTerms: "Tenant is responsible for any pet-related damage beyond normal wear and tear.",
  },
};

/** Compute the end date (timestamp) from a start date + term type */
export function computeEndDate(
  startTimestamp: number,
  termType: LeaseTermType,
  customMonths?: number,
): number | undefined {
  if (termType === "month-to-month") return undefined;
  const months =
    termType === "12-month" ? 12 :
    termType === "24-month" ? 24 :
    (customMonths ?? 12);
  const d = new Date(startTimestamp);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

export function termLabel(termType: LeaseTermType, customMonths?: number): string {
  if (termType === "month-to-month") return "Month-to-Month";
  if (termType === "12-month") return "12 Months";
  if (termType === "24-month") return "24 Months";
  return `${customMonths ?? "?"} Months`;
}
