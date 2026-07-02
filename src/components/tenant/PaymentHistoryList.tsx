"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { paymentsCol, paymentReviewsCol } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PaymentDoc, PaymentReviewDoc } from "@/lib/types/models";

interface Props {
  tenantId: string;
  city?: string;
  state?: string;
}

interface DualThumbsPopup {
  show: boolean;
  paymentId: string;
  city?: string;
  state?: string;
}

export function PaymentHistoryList({ tenantId, city, state }: Props) {
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [reviews, setReviews] = useState<Map<string, PaymentReviewDoc>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [dualPopup, setDualPopup] = useState<DualThumbsPopup>({ show: false, paymentId: "" });
  const seenDual = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = query(paymentsCol(), where("tenantId", "==", tenantId));
    return onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setLoading(false);
    }, () => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    const q = query(paymentReviewsCol(), where("tenantId", "==", tenantId));
    return onSnapshot(q, (snap) => {
      const map = new Map<string, PaymentReviewDoc>();
      snap.docs.forEach((d) => map.set(d.data().paymentId, { ...d.data(), id: d.id }));
      setReviews(map);

      // Show dual thumbs popup if both parties just approved
      snap.docs.forEach((d) => {
        const rev = d.data() as PaymentReviewDoc;
        if (
          rev.tenantReview === "up" &&
          rev.pmReview === "up" &&
          !seenDual.current.has(rev.paymentId)
        ) {
          seenDual.current.add(rev.paymentId);
          setDualPopup({ show: true, paymentId: rev.paymentId, city, state });
          setTimeout(() => setDualPopup({ show: false, paymentId: "" }), 5000);
        }
      });
    });
  }, [tenantId, city, state]);

  async function handleReview(payment: PaymentDoc, vote: "up" | "down") {
    if (submitting) return;
    setSubmitting(payment.id);
    try {
      await setDoc(
        doc(db, "paymentReviews", payment.id),
        {
          paymentId: payment.id,
          tenantId,
          ...(payment.leaseId ? { leaseId: payment.leaseId } : {}),
          tenantReview: vote,
          tenantReviewedAt: Date.now(),
        },
        { merge: true },
      );
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading payment history…</p>;

  if (payments.length === 0) {
    return (
      <Card className="p-5">
        <CardContent className="p-0">
          <p className="text-sm text-neutral-600">
            No payments yet. Once you pay rent through ResiGrid, your history will show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Dual thumbs popup */}
      {dualPopup.show && (
        <div className="fixed inset-0 z-[9500] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-10 py-7 shadow-2xl animate-bounce-in text-center">
            <div className="flex gap-2 text-5xl">👍👍</div>
            <p className="text-lg font-bold text-navy-900">Payment Confirmed!</p>
            <p className="text-sm text-neutral-600">
              Both parties approved this payment
              {dualPopup.city && dualPopup.state ? ` in ${dualPopup.city}, ${dualPopup.state}` : ""}.
            </p>
            <p className="text-xs text-green-600 font-medium">+RGE points earned</p>
          </div>
          <style>{`
            @keyframes bounce-in {
              0%   { transform: scale(0.7); opacity: 0; }
              60%  { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-bounce-in { animation: bounce-in 0.45s ease-out forwards; }
          `}</style>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {payments.map((payment) => {
          const review = reviews.get(payment.id);
          const tenantVote = review?.tenantReview;
          const pmVote = review?.pmReview;
          const bothUp = tenantVote === "up" && pmVote === "up";
          const isCompleted = payment.status === "completed";

          return (
            <Card key={payment.id} className="p-4">
              <CardContent className="flex items-center justify-between gap-3 p-0">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    ${payment.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {payment.paidDate
                      ? new Date(payment.paidDate).toLocaleDateString()
                      : "Pending"}
                  </p>
                  {bothUp && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">👍👍 Dual confirmed</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Thumbs buttons — only on completed payments */}
                  {isCompleted && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={submitting === payment.id}
                        onClick={() => handleReview(payment, "up")}
                        title="Thumbs up"
                        className={`rounded-full p-1.5 transition ${
                          tenantVote === "up"
                            ? "bg-green-100 text-green-600"
                            : "text-neutral-400 hover:bg-green-50 hover:text-green-500"
                        }`}
                      >
                        <span className="text-base leading-none">👍</span>
                      </button>
                      <button
                        type="button"
                        disabled={submitting === payment.id}
                        onClick={() => handleReview(payment, "down")}
                        title="Thumbs down"
                        className={`rounded-full p-1.5 transition ${
                          tenantVote === "down"
                            ? "bg-red-100 text-red-600"
                            : "text-neutral-400 hover:bg-red-50 hover:text-red-400"
                        }`}
                      >
                        <span className="text-base leading-none">👎</span>
                      </button>
                    </div>
                  )}

                  <Badge
                    tone={
                      payment.status === "completed"
                        ? payment.onTime
                          ? "success"
                          : "warning"
                        : payment.status === "failed"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {payment.status === "completed"
                      ? payment.onTime
                        ? "On time"
                        : "Late"
                      : payment.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
