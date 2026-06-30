import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import type { UserDoc } from "../types";

export const onUserDocCreated = onDocumentCreated("users/{uid}", async (event) => {
  const user = event.data?.data() as UserDoc | undefined;
  if (!user || user.role !== "property_manager") return;

  const ref = db.collection("propertyManagers").doc(event.params.uid);
  const existing = await ref.get();
  if (existing.exists) return;

  await ref.set({
    uid: event.params.uid,
    businessName: user.displayName,
    propertyIds: [],
  });
});
