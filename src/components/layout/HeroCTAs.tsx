"use client";

import { useState } from "react";
import Link from "next/link";
import { RGEScoreModal } from "@/components/ui/RGEScoreModal";

export function HeroCTAs() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-white hover:bg-orange-600"
        >
          Join the Grid
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
        >
          See How the RGE Score Works
        </button>
      </div>

      <RGEScoreModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
