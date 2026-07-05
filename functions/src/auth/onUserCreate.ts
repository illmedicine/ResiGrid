import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import { sendEmail, templates, SMTP_SECRETS } from "../lib/mailer";
import type { UserDoc } from "../types";

export const onUserDocCreated = onDocumentCreated(
  { document: "users/{uid}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const user = event.data?.data() as UserDoc | undefined;
    if (!user) return;

    // Bootstrap propertyManagers doc for PMs
    if (user.role === "property_manager") {
      const ref = db.collection("propertyManagers").doc(event.params.uid);
      const existing = await ref.get();
      if (!existing.exists) {
        await ref.set({ uid: event.params.uid, businessName: user.displayName, propertyIds: [] });
      }
    }

    // Send welcome email
    if (!user.email) return;
    const tmpl =
      user.role === "property_manager"
        ? templates.welcomePM({ name: user.displayName })
        : templates.welcomeTenant({ name: user.displayName });

    await sendEmail(user.email, tmpl.subject, tmpl.html, tmpl.text);
  },
);
