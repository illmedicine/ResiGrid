"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useMyNotices } from "@/lib/hooks/useMyNotices";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function TenantNoticesPage() {
  const { notices, unreadCount, markRead, markAllRead } = useMyNotices();

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Notices</h1>
          <p className="text-sm text-neutral-600">
            {unreadCount > 0
              ? `${unreadCount} unread notice${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notices.length === 0 && (
        <Card className="p-10">
          <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
            <span className="rounded-full bg-neutral-100 p-4 text-neutral-400">
              <Bell className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">No notices yet</p>
              <p className="text-xs text-neutral-500">
                Your property manager hasn&apos;t posted any notices.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {notices.map((notice) => (
          <Card
            key={notice.id}
            className={`p-4 transition ${
              notice.unread
                ? "cursor-pointer border-orange-200 bg-orange-50/40 hover:bg-orange-50/60"
                : ""
            }`}
            onClick={() => notice.unread && markRead(notice.id)}
          >
            <CardContent className="flex flex-col gap-2 p-0">
              <div className="flex items-start justify-between gap-3">
                <p
                  className={`text-sm font-semibold ${
                    notice.unread ? "text-navy-900" : "text-neutral-700"
                  }`}
                >
                  {notice.title}
                </p>
                {notice.unread && <Badge tone="warning">New</Badge>}
              </div>
              <p className="text-sm leading-relaxed text-neutral-600">{notice.content}</p>
              <p className="text-xs text-neutral-400">
                {new Date(notice.createdAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {notice.scope !== "all" && (
                  <span className="ml-2">
                    · {notice.scope === "property" ? "Building notice" : "Unit notice"}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
