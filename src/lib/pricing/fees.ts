export const PM_BASE_FEE = 40;
export const PM_EXTRA_UNIT_FEE = 10;

/** Total one-time fee for onboarding a property with `unitCount` units. */
export function calculatePropertyFee(unitCount: number): number {
  const units = Math.max(1, Math.floor(unitCount));
  return PM_BASE_FEE + Math.max(0, units - 1) * PM_EXTRA_UNIT_FEE;
}

/** Human-readable breakdown string shown on the checkout page. */
export function feeBreakdown(unitCount: number): string {
  const units = Math.max(1, Math.floor(unitCount));
  const total = calculatePropertyFee(units);
  if (units === 1) {
    return `$${PM_BASE_FEE} — 1 property + 1 unit`;
  }
  const extra = units - 1;
  return `$${PM_BASE_FEE} base + ${extra} extra unit${extra > 1 ? "s" : ""} × $${PM_EXTRA_UNIT_FEE} = $${total}`;
}
