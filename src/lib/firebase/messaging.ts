import { addDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "./config";
import { messageThreadsCol, threadMessagesCol } from "./firestore";

export async function getOrCreateThread(
  participantIds: [string, string],
  context?: { propertyId?: string; leaseId?: string },
): Promise<string> {
  const sorted = [...participantIds].sort();
  const q = query(
    messageThreadsCol(),
    where("participantIds", "==", sorted),
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const ref = await addDoc(messageThreadsCol(), {
    id: "",
    participantIds: sorted,
    propertyId: context?.propertyId,
    leaseId: context?.leaseId,
    lastMessageAt: Date.now(),
  });
  return ref.id;
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  content: string,
) {
  await addDoc(threadMessagesCol(threadId), {
    id: "",
    threadId,
    senderId,
    content,
    createdAt: Date.now(),
    readBy: [senderId],
  });
  await updateDoc(doc(db, "messageThreads", threadId), {
    lastMessageAt: Date.now(),
    lastMessageSnippet: content.slice(0, 140),
  });
}
