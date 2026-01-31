import { NextResponse } from "next/server";
import { notifyWeekendContestStart, notifyWeekendReminder } from "~/server/cron/weekend-notifications";

/**
 * API route for weekend notifications cron jobs
 * 
 * Schedule these endpoints using a cron service:
 * - Saturday 00:00 IST: /api/cron/weekend-notifications?type=start
 * - Sunday 18:00 IST: /api/cron/weekend-notifications?type=reminder
 * 
 * You can use services like:
 * - Vercel Cron (vercel.json)
 * - GitHub Actions
 * - Cron-job.org
 * - EasyCron
 */

export async function GET(request: Request) {
  try {
    // Security: Check for authorization header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "start") {
      await notifyWeekendContestStart();
      return NextResponse.json({
        success: true,
        message: "Weekend contest start notifications sent",
      });
    } else if (type === "reminder") {
      await notifyWeekendReminder();
      return NextResponse.json({
        success: true,
        message: "Weekend reminder notifications sent",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid type. Use ?type=start or ?type=reminder" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications", details: String(error) },
      { status: 500 }
    );
  }
}
