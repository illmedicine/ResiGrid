import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

interface MessageDoc {
  senderId: string;
  content: string;
}

// Notification delivery (email/SMS/push) is not wired up yet — this logs the
// event so the integration point is obvious once a provider is chosen.
export const notifyOnNewMessage = onDocumentCreated(
  "messageThreads/{threadId}/messages/{messageId}",
  async (event) => {
    const message = event.data?.data() as MessageDoc | undefined;
    if (!message) return;

    logger.info("New message — notify other thread participant(s)", {
      threadId: event.params.threadId,
      senderId: message.senderId,
    });
  },
);
