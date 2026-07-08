import type { ExternalPayMethod } from "@/lib/types/models";

interface ExternalMethodMeta {
  label: string;
  /** Symbol shown before the handle (e.g. "$" for Cash App). */
  handlePrefix: string;
  placeholder: string;
  configHint: string;
  /** Deep link to pay this handle, when the app supports one. */
  payUrl?: (handle: string, amount?: number) => string;
  /** Shown to tenants when there's no universal web pay link. */
  tenantInstructions?: (handle: string) => string;
  /** Brand accent for the method chip. */
  color: string;
}

export const EXTERNAL_METHODS: Record<ExternalPayMethod, ExternalMethodMeta> = {
  paypal: {
    label: "PayPal",
    handlePrefix: "paypal.me/",
    placeholder: "yourname",
    configHint: "Your PayPal.me username — create one free at paypal.me",
    payUrl: (handle, amount) =>
      `https://paypal.me/${encodeURIComponent(handle)}${amount ? `/${amount}` : ""}`,
    color: "#003087",
  },
  cashapp: {
    label: "Cash App",
    handlePrefix: "$",
    placeholder: "YourCashtag",
    configHint: "Your $cashtag from the Cash App profile screen",
    payUrl: (handle, amount) =>
      `https://cash.app/$${encodeURIComponent(handle)}${amount ? `/${amount}` : ""}`,
    color: "#00d632",
  },
  venmo: {
    label: "Venmo",
    handlePrefix: "@",
    placeholder: "your-username",
    configHint: "Your Venmo username (Settings → Profile)",
    payUrl: (handle) => `https://venmo.com/u/${encodeURIComponent(handle)}`,
    color: "#3d95ce",
  },
  chime: {
    label: "Chime",
    handlePrefix: "$",
    placeholder: "YourChimeSign",
    configHint: "Your $ChimeSign (Chime app → Pay Anyone)",
    tenantInstructions: (handle) =>
      `Open the Chime app → Pay Anyone → send to $${handle}`,
    color: "#1ec677",
  },
  zelle: {
    label: "Zelle",
    handlePrefix: "",
    placeholder: "you@email.com or (555) 123-4567",
    configHint: "The email or U.S. phone number enrolled with Zelle at your bank",
    tenantInstructions: (handle) =>
      `Open your banking app → Zelle → send to ${handle}`,
    color: "#6d1ed4",
  },
};

export const EXTERNAL_METHOD_KEYS = Object.keys(EXTERNAL_METHODS) as ExternalPayMethod[];
