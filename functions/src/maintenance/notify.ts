import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import type { MaintenanceRequestDoc, PropertyDoc } from "../types";

// Notification delivery (email/SMS/push) is not wired up yet — this logs the
// event so the integration point is obvious once a provider (e.g. SendGrid,
// Twilio, FCM) is chosen.
export const notifyOnMaintenanceRequest = onDocumentCreated(
  "maintenanceRequests/{requestId}",
  async (event) => {
    const request = event.data?.data() as MaintenanceRequestDoc | undefined;
    if (!request) return;

    const propertySnap = await db.collection("properties").doc(request.propertyId).get();
    const property = propertySnap.data() as PropertyDoc | undefined;
    if (!property) return;

    logger.info("New maintenance request — notify property manager", {
      ownerId: property.ownerId,
      requestId: event.params.requestId,
      category: request.category,
      priority: request.priority,
    });
  },
);
