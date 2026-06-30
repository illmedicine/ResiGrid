// Square Web Payments SDK loader. Production-only per project config —
// see .env.local.example for NEXT_PUBLIC_SQUARE_ENV.

declare global {
  interface Window {
    Square?: {
      payments: (
        applicationId: string,
        locationId: string,
      ) => Promise<SquarePayments>;
    };
  }
}

export interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<{
    status: string;
    token?: string;
    errors?: { message: string }[];
  }>;
  destroy: () => Promise<void>;
}

export interface SquarePayments {
  card: () => Promise<SquareCard>;
}

const SQUARE_SDK_URL = "https://web.squarecdn.com/v1/square.js";

let sdkPromise: Promise<void> | null = null;

function loadSquareSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Square SDK can only be loaded in the browser"),
    );
  }
  if (window.Square) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SQUARE_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Square SDK"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

// Square Application ID and Location ID are public browser identifiers — safe to commit.
const SQUARE_APPLICATION_ID = "sq0idp--js2-VRPmjasfeN7tp039A";
const SQUARE_LOCATION_ID = "LA83XYXM6FADM";

export async function getSquarePayments(): Promise<SquarePayments> {
  await loadSquareSdk();
  if (!window.Square) {
    throw new Error("Square SDK failed to load");
  }
  return window.Square.payments(SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID);
}
