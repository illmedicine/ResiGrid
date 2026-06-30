"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { Plus } from "lucide-react";
import { noticesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { NoticeDoc } from "@/lib/types/models";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});
type FormValues = z.infer<typeof schema>;

export default function PmNoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<NoticeDoc[]>([]);
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!user) return;
    const q = query(
      noticesCol(),
      where("pmId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map((d) => d.data()));
    });
    return unsub;
  }, [user]);

  async function onSubmit(values: FormValues) {
    if (!user) return;
    await addDoc(noticesCol(), {
      id: "",
      pmId: user.uid,
      scope: "all",
      title: values.title,
      content: values.content,
      createdAt: Date.now(),
    });
    reset();
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Notices</h1>
          <p className="text-sm text-neutral-600">
            Post announcements to your tenants.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New notice
        </Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input label="Title" {...register("title")} error={errors.title?.message} />
              <Textarea
                label="Content"
                rows={4}
                {...register("content")}
                error={errors.content?.message}
              />
              <Button type="submit" className="w-fit">
                Post notice
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {notices.length === 0 ? (
        <Card className="p-5">
          <CardContent className="p-0">
            <p className="text-sm text-neutral-600">No notices posted yet.</p>
          </CardContent>
        </Card>
      ) : (
        notices.map((notice) => (
          <Card key={notice.id} className="p-4">
            <CardContent className="flex flex-col gap-1 p-0">
              <p className="text-sm font-semibold text-navy-900">{notice.title}</p>
              <p className="text-sm text-neutral-600">{notice.content}</p>
              <p className="text-xs text-neutral-600">
                {new Date(notice.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
