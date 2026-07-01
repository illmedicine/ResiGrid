"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { messageThreadsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { useUserDisplayName } from "@/lib/hooks/useUserDisplayName";
import type { MessageThreadDoc } from "@/lib/types/models";

interface MessageThreadListProps {
  userId: string;
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
}

export function MessageThreadList({
  userId,
  selectedThreadId,
  onSelect,
}: MessageThreadListProps) {
  const [threads, setThreads] = useState<MessageThreadDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      messageThreadsCol(),
      where("participantIds", "array-contains", userId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setThreads(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [userId]);

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>;

  if (threads.length === 0) {
    return (
      <Card className="p-5">
        <CardContent className="p-0">
          <p className="text-sm text-neutral-600">No conversations yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          userId={userId}
          selected={selectedThreadId === thread.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function ThreadRow({
  thread,
  userId,
  selected,
  onSelect,
}: {
  thread: MessageThreadDoc;
  userId: string;
  selected: boolean;
  onSelect: (threadId: string) => void;
}) {
  const otherId = thread.participantIds.find((id) => id !== userId);
  const otherName = useUserDisplayName(otherId);

  return (
    <button
      onClick={() => onSelect(thread.id)}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-orange-400 bg-orange-100/40"
          : "border-neutral-200 bg-white hover:bg-neutral-50",
      )}
    >
      <p className="text-sm font-medium text-navy-900">
        {otherName ?? "Conversation"}
      </p>
      <p className="truncate text-xs text-neutral-600">
        {thread.lastMessageSnippet ?? "No messages yet"}
      </p>
    </button>
  );
}
