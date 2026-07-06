"use client";

import { useCallback, type MouseEvent } from "react";

const HARD_NAV_FALLBACK_MS = 400;

function normalizePath(path: string): string {
  return path.replace(/\/$/, "") || "/";
}

/**
 * Next.js's client-side <Link> transition has been observed to silently
 * no-op under some browser privacy modes (e.g. Chrome Incognito) — no
 * console error, no network request, no URL change; only a real (hard)
 * navigation or right-click "open in new tab" gets there. This is a
 * capture-phase click handler (attach via onClickCapture on an ancestor of
 * any <Link>s) that watches for the URL to actually change shortly after a
 * link click, and forces a full browser navigation if it doesn't — without
 * altering behavior at all when the soft transition works normally.
 */
export function useHardNavFallback() {
  return useCallback((e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    if (anchor.target && anchor.target !== "_self") return;

    const href = anchor.getAttribute("href");
    if (!href || /^([a-z]+:)?\/\//i.test(href) || href.startsWith("#")) return;
    if (normalizePath(href) === normalizePath(window.location.pathname)) return;

    const startPath = window.location.pathname;
    setTimeout(() => {
      if (window.location.pathname === startPath) {
        window.location.href = href;
      }
    }, HARD_NAV_FALLBACK_MS);
  }, []);
}
