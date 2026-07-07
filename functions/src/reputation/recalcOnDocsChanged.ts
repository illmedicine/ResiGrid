import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { recalcTenantScore } from "./recalc";

/** Keeps the RGE score's document-engagement bonus current whenever a
 * tenant's applications or shared documents change. */
export const recalcScoreOnApplicationChanged = onDocumentWritten(
  "applications/{applicationId}",
  async (event) => {
    const tenantId =
      (event.data?.after?.data() as { tenantId?: string } | undefined)?.tenantId ??
      (event.data?.before?.data() as { tenantId?: string } | undefined)?.tenantId;
    if (!tenantId) return;
    await recalcTenantScore(tenantId);
  },
);

export const recalcScoreOnSharedDocumentChanged = onDocumentWritten(
  "sharedDocuments/{docId}",
  async (event) => {
    const tenantId =
      (event.data?.after?.data() as { tenantId?: string } | undefined)?.tenantId ??
      (event.data?.before?.data() as { tenantId?: string } | undefined)?.tenantId;
    if (!tenantId) return;
    await recalcTenantScore(tenantId);
  },
);
