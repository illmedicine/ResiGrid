"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { MessageThreadList } from "@/components/shared/MessageThreadList";
import { MessageThreadView } from "@/components/shared/MessageThreadView";
import { cn } from "@/lib/utils/cn";

export default function PmMessagesPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 md:h-[calc(100vh-5rem)] md:flex-row">
      <div
        className={cn(
          "w-full overflow-y-auto md:w-72 md:shrink-0",
          selected ? "hidden md:block" : "block",
        )}
      >
        <h1 className="mb-3 text-xl font-bold text-navy-900">Messages</h1>
        <MessageThreadList
          userId={user.uid}
          selectedThreadId={selected}
          onSelect={setSelected}
        />
      </div>
      <div className={cn("flex-1", selected ? "block" : "hidden md:block")}>
        {selected ? (
          <MessageThreadView
            threadId={selected}
            currentUserId={user.uid}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-600">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
