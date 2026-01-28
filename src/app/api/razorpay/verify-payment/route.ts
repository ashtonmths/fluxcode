import { NextResponse } from "next/server";
import { getUser } from "~/lib/supabase/server";
import { db } from "~/server/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentId,
      contestId,
    } = await request.json();

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Update payment record
    const payment = await db.payment.update({
      where: { id: paymentId },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: "completed",
      },
    });

    // Update participant payment status
    if (payment.weekNumber === null) {
      // Entry payment
      await db.contestParticipant.update({
        where: {
          contestId_userId: {
            contestId,
            userId: user.id,
          },
        },
        data: {
          hasPaid: true,
          needsPayment: false,
          lastPaymentDate: new Date(),
        },
      });
    } else {
      // Penalty payment
      await db.contestParticipant.update({
        where: {
          contestId_userId: {
            contestId,
            userId: user.id,
          },
        },
        data: {
          needsPayment: false,
          lastPaymentDate: new Date(),
          currentStreak: 0,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
