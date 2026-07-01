"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Restores the URL that was stored by public/404.html when GitHub Pages
 * serves a 404 and redirects to the root. Without this, direct-linking
 * deep routes (e.g. /tenant/dashboard) would always land on the homepage.
 */
export function SpaRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    const path = sessionStorage.getItem("spa_redirect");
    if (path && path !== "/") {
      sessionStorage.removeItem("spa_redirect");
      router.replace(path);
    }
  }, [router]);

  return null;
}
