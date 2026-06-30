"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SquareCard } from "@/lib/square/client";
import { getSquarePayments } from "@/lib/square/client";

interface SquareCardFieldProps {
  onReady: (card: SquareCard | null) => void;
}

export function SquareCardField({ onReady }: SquareCardFieldProps) {
  const containerId = useId().replace(/:/g, "-");
  const cardRef = useRef<SquareCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const payments = await getSquarePayments();
        const card = await payments.card();
        await card.attach(`#${containerId}`);
        if (cancelled) {
          await card.destroy();
          return;
        }
        cardRef.current = card;
        onReady(card);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load card form",
        );
      }
    })();

    return () => {
      cancelled = true;
      cardRef.current?.destroy();
      onReady(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  return (
    <div>
      <div id={containerId} className="rounded-lg border border-neutral-200 p-3" />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
