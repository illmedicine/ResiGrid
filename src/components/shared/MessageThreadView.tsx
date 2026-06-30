"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";
import { threadMessagesCol } from "@/lib/firebase/firestore";
import { sendMessage } from "@/lib/firebase/messaging";
import { cn } from "@/lib/utils/cn";
import type { MessageDoc } from "@/lib/types/models";

interface MessageThreadViewProps {
  threadId: string;
  currentUserId: string;
  onBack?: () => void;
}

export function MessageThreadView({
  threadId,
  currentUserId,
  onBack,
}: MessageThreadViewProps) {
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(threadMessagesCol(threadId), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });
    return unsub;
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage(threadId, currentUserId, content);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm font-medium text-navy-900 md:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                msg.senderId === currentUserId
                  ? "ml-auto bg-orange-500 text-white"
                  : "bg-neutral-100 text-navy-900",
              )}
            >
              {msg.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-lg bg-orange-500 px-3 py-2 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
