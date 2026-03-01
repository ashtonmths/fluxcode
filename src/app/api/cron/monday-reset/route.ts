import { NextResponse } from "next/server";
import { checkAndResetPaymentStatus } from "~/server/cron/monday-reset";

/**
 * API route for the Monday payment reset cron job.
 *
 * Schedule via cron-job.org:
 *   Cron expression : 0 18 * * 0   (Sunday 18:30 UTC = Monday 00:00 IST)
 *   URL             : https://yourdomain.com/api/cron/monday-reset
 *   Header          : Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
          details: "CRON_SECRET not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: "Missing Authorization header",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: "Invalid authorization token",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // ── Run reset ─────────────────────────────────────────────────────────
    console.log(
      `[CRON] monday-reset started at ${new Date().toISOString()}`
    );
    await checkAndResetPaymentStatus();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message:
        "Monday payment reset completed — participants who solved <2/3 weekend problems have been set to pending",
      executionTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[CRON] monday-reset error:", error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack =
      error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: errorMessage,
        stack:
          process.env.NODE_ENV === "development" ? errorStack : undefined,
        executionTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
