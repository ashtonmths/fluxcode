"use client";

import { useState } from "react";
import Script from "next/script";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestId: string;
  amount: number;
  weekNumber?: number;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  contestId,
  amount,
  weekNumber,
  onSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);

  const initializePayment = async () => {
    setLoading(true);

    try {
      // Create Razorpay order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId, weekNumber }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await orderResponse.json();

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "FluxCode",
        description: weekNumber
          ? `Penalty Payment - Week ${weekNumber}`
          : "Contest Entry Fee",
        order_id: orderData.orderId,
        handler: (response) => {
          // Verify payment
          void (async () => {
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: orderData.paymentId,
                contestId,
              }),
            });

            if (verifyResponse.ok) {
              onSuccess();
              onClose();
            } else {
              alert("Payment verification failed");
            }
          })();
        },
        theme: {
          color: "#a855f7",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="w-full max-w-md rounded-lg border border-purple-500/20 bg-black/95 p-8 backdrop-blur-xl">
          <h2 className="mb-4 text-2xl font-bold text-white">
            {weekNumber ? "Penalty Payment" : "Entry Fee Payment"}
          </h2>
          <p className="mb-6 text-gray-400">
            {weekNumber
              ? `You need to pay ₹${amount} penalty for failing week ${weekNumber} weekend test.`
              : `Pay ₹${amount} to join this contest.`}
          </p>
          <div className="mb-6 rounded-lg bg-purple-500/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg text-white">Amount:</span>
              <span className="text-2xl font-bold text-purple-400">
                ₹{amount}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={initializePayment}
              disabled={loading}
              className="flex-1 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-purple-500/20 bg-black/50 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-500/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
