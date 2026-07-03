"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Send } from "lucide-react";
import { maintenanceMessagesCol } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";
import type { MaintenanceMessageDoc } from "@/lib/types/models";

interface Props {
  requestId: string;
  currentUserId: string;
  /** Label shown for the other party's messages */
  otherPartyLabel: string;
}

export function MaintenanceDMThread({ requestId, currentUserId, otherPartyLabel }: Props) {
  const [messages, setMessages] = useState<MaintenanceMessageDoc[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(maintenanceMessagesCol(requestId), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ ...d.data(), id: d.id } as MaintenanceMessageDoc)));
    });
  }, [requestId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      await addDoc(maintenanceMessagesCol(requestId), {
        id: "",
        senderId: currentUserId,
        content,
        createdAt: Date.now(),
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isMe = (msg: MaintenanceMessageDoc) => msg.senderId === currentUserId;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-neutral-500">
        Messages with {otherPartyLabel}
      </p>

      {/* Message thread */}
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-lg border border-neutral-100 bg-neutral-50 p-3">
        {messages.length === 0 ? (
          <p className="text-center text-[11px] text-neutral-400">
            No messages yet — start the conversation below.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = isMe(msg);
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    mine
                      ? "rounded-br-sm bg-orange-500 text-white"
                      : "rounded-bl-sm bg-white text-navy-900 shadow-sm ring-1 ring-neutral-200"
                  }`}
                >
                  {msg.content}
                </div>
                <p className="text-[9px] text-neutral-400">
                  {mine ? "You" : otherPartyLabel} ·{" "}
                  {new Date(msg.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
          placeholder={`Message ${otherPartyLabel}… (Enter to send)`}
          className="flex-1 resize-none rounded-lg border border-neutral-300 px-3 py-2 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="self-end"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
