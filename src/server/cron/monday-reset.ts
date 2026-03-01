import { db } from "~/server/db";

/**
 * Monday 12:00 AM reset cron job
 *
 * Runs every Monday at midnight IST via cron-job.org hitting:
 *   GET /api/cron/monday-reset
 *
 * For each active contest it inspects the *previous* week's weekend test.
 * Any paid participant who solved fewer than 2 out of 3 weekend problems
 * has their paymentStatus reset to "pending".
 *
 * Fields updated per participant on every run:
 *   - lastWeekendAttempt  → now
 *   - lastWeekendSuccess  → true if solvedCount >= 2, false otherwise
 *   - paymentStatus       → "pending" only when lastWeekendSuccess becomes false
 */
export async function checkAndResetPaymentStatus() {
  console.log("\n=== Running Monday payment reset cron ===");
  console.log("Timestamp:", new Date().toISOString());

  try {
    // Fetch all active contests with participants + problem progress
    const contests = await db.contest.findMany({
      where: { isActive: true },
      include: {
        participants: {
          include: { user: true },
        },
        topics: {
          include: {
            problems: {
              include: { progress: true },
            },
          },
        },
      },
    });

    console.log(`Found ${contests.length} active contest(s)`);

    if (contests.length === 0) {
      console.log("⚠️  No active contests — nothing to reset");
      console.log("=== Monday payment reset completed ===\n");
      return;
    }

    // Shared syllabus type definitions
    interface SyllabusWeek {
      weekNumber: number;
      weekendTest?: {
        problems: Array<{ id: string; title: string; difficulty: string }>;
      };
    }
    interface Syllabus {
      weeks: SyllabusWeek[];
    }

    const syllabusMap: Record<string, string> = {
      beginner: "beginner-9months.json",
      intermediate: "intermediate-6months.json",
      advanced: "advanced-5months.json",
    };

    for (const contest of contests) {
      const now = new Date();
      const startDate = new Date(contest.startDate);

      // Skip contests that haven't started yet
      if (now < startDate) {
        console.log(
          `\nContest "${contest.name}" hasn't started yet — skipping`
        );
        continue;
      }

      // How many full weeks have elapsed since contest start?
      // On Monday 12am the previous Sat/Sun weekend is fully complete,
      // so weeksSinceStart gives us the last completed week index (1-based).
      const weeksSinceStart = Math.floor(
        (now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      // If we're still in contest week 1 (first Monday), there's no prior weekend
      if (weeksSinceStart < 1) {
        console.log(
          `\nContest "${contest.name}" is in its first week — no previous weekend to check`
        );
        continue;
      }

      const previousWeekNumber = weeksSinceStart; // 1-based week that just ended

      console.log(
        `\n📅 Contest "${contest.name}" — checking week ${previousWeekNumber} weekend`
      );

      // Load syllabus
      const syllabusFile = syllabusMap[contest.difficulty];
      if (!syllabusFile) {
        console.error(`  Unknown difficulty "${contest.difficulty}" — skipping`);
        continue;
      }

      let syllabus: Syllabus;
      try {
        syllabus = await import(
          `../../../public/syllabi/${syllabusFile}`
        ) as Syllabus;
      } catch (err) {
        console.error(`  Failed to load syllabus for contest ${contest.id}:`, err);
        continue;
      }

      const weekData = syllabus.weeks.find(
        (w) => w.weekNumber === previousWeekNumber
      );

      if (!weekData?.weekendTest) {
        console.log(
          `  ⚠️  No weekendTest defined for week ${previousWeekNumber} — skipping`
        );
        continue;
      }

      const weekendProblemIds = weekData.weekendTest.problems.map((p) => p.id);
      console.log(
        `  Weekend problem IDs: ${weekendProblemIds.join(", ")}`
      );

      // Collect the matching Problem DB rows (matched by leetcodeId)
      const weekendProblems: Array<{
        id: string;
        leetcodeId: string;
        progress: Array<{ userId: string; completed: boolean }>;
      }> = [];

      for (const topic of contest.topics) {
        const matching = topic.problems.filter((p) =>
          weekendProblemIds.includes(p.leetcodeId)
        );
        weekendProblems.push(...matching);
      }

      if (weekendProblems.length === 0) {
        console.log(
          `  ⚠️  None of the weekend problem IDs found in DB for this contest — skipping`
        );
        continue;
      }

      console.log(
        `  Found ${weekendProblems.length}/${weekendProblemIds.length} weekend problems in DB`
      );

      // --- Per-participant evaluation ---
      let resetCount = 0;
      let passCount = 0;
      let skippedCount = 0;

      for (const participant of contest.participants) {
        // Only evaluate participants who are currently paid
        if (participant.paymentStatus !== "paid") {
          skippedCount++;
          continue;
        }

        const solvedCount = weekendProblems.filter((problem) =>
          problem.progress.some(
            (p) => p.userId === participant.userId && p.completed
          )
        ).length;

        const passed = solvedCount >= 2;

        console.log(
          `  👤 ${participant.user.name ?? participant.userId} (${participant.user.email ?? "no email"}): ` +
          `${solvedCount}/${weekendProblems.length} solved → ${passed ? "✅ PASS" : "❌ FAIL — resetting to pending"}`
        );

        // Always update attempt tracking; only reset payment when failed
        await db.contestParticipant.update({
          where: { id: participant.id },
          data: {
            lastWeekendAttempt: now,
            lastWeekendSuccess: passed,
            ...(passed ? {} : { paymentStatus: "pending" }),
          },
        });

        if (passed) {
          passCount++;
        } else {
          resetCount++;
        }
      }

      console.log(
        `  ✅ Results: ${passCount} passed, ${resetCount} reset to pending, ${skippedCount} skipped (not paid)`
      );
    }

    console.log("\n=== Monday payment reset completed successfully ===\n");
  } catch (error) {
    console.error("\n❌ Error in checkAndResetPaymentStatus:", error);
    throw error;
  }
}
