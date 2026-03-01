import { notifyWeekendContestStart, notifyWeekendReminder } from "./weekend-notifications";
import { checkAndResetPaymentStatus } from "./monday-reset";
import { sendWeekendContestStart, sendWeekendReminderIncomplete } from "~/server/services/email";

/**
 * Test script for email notifications
 * Run with: npx tsx --env-file=.env src/server/cron/test-email.ts
 */

async function main() {
  console.log("Testing email notifications...\n");

  const args = process.argv.slice(2);
  const testType = args[0];
  const testEmail = args[1]; // Optional email parameter

  try {
    if (testType === "start") {
      if (testEmail) {
        console.log(`Testing weekend contest start notification to ${testEmail}...`);
        await sendWeekendContestStart(testEmail, {
          name: "Test User",
          contestName: "Test Contest",
          weekNumber: 1,
          problems: [
            { title: "Two Sum", difficulty: "Easy" },
            { title: "Add Two Numbers", difficulty: "Medium" },
            { title: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
          ],
          contestUrl: "http://localhost:3000/contest/test-123",
        });
        console.log(`✅ Test email sent to ${testEmail}`);
      } else {
        console.log("Testing weekend contest start notification...");
        await notifyWeekendContestStart();
      }
    } else if (testType === "reminder") {
      if (testEmail) {
        console.log(`Testing weekend reminder notification to ${testEmail}...`);
        await sendWeekendReminderIncomplete(testEmail, {
          name: "Test User",
          contestName: "Test Contest",
          weekNumber: 1,
          solvedCount: 1,
          totalProblems: 3,
          unsolvedProblems: [
            { title: "Add Two Numbers", difficulty: "Medium" },
            { title: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
          ],
          contestUrl: "http://localhost:3000/contest/test-123",
        });
        console.log(`✅ Test email sent to ${testEmail}`);
      } else {
        console.log("Testing weekend reminder notification (6 PM Sunday)...");
        await notifyWeekendReminder();
      }
    } else if (testType === "both") {
      if (testEmail) {
        console.log(`Testing both notifications to ${testEmail}...\n`);
        console.log("1. Testing weekend contest start...");
        await sendWeekendContestStart(testEmail, {
          name: "Test User",
          contestName: "Test Contest",
          weekNumber: 1,
          problems: [
            { title: "Two Sum", difficulty: "Easy" },
            { title: "Add Two Numbers", difficulty: "Medium" },
            { title: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
          ],
          contestUrl: "http://localhost:3000/contest/test-123",
        });
        console.log(`✅ Start email sent to ${testEmail}\n`);
        
        console.log("2. Testing weekend reminder...");
        await sendWeekendReminderIncomplete(testEmail, {
          name: "Test User",
          contestName: "Test Contest",
          weekNumber: 1,
          solvedCount: 1,
          totalProblems: 3,
          unsolvedProblems: [
            { title: "Add Two Numbers", difficulty: "Medium" },
            { title: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
          ],
          contestUrl: "http://localhost:3000/contest/test-123",
        });
        console.log(`✅ Reminder email sent to ${testEmail}`);
      } else {
        console.log("Testing both notifications...\n");
        console.log("1. Testing weekend contest start...");
        await notifyWeekendContestStart();
        console.log("\n2. Testing weekend reminder...");
        await notifyWeekendReminder();
      }
    } else if (testType === "reset") {
      console.log("Testing Monday payment reset cron...");
      await checkAndResetPaymentStatus();
    } else {
      console.log(`
Usage:
  npx tsx --env-file=.env src/server/cron/test-email.ts [type] [email]

Types:
  start     - Test weekend contest start notification (Saturday midnight)
  reminder  - Test weekend reminder notification (Sunday 6 PM)
  both      - Test both notifications
  reset     - Test Monday payment reset cron (resets paymentStatus for participants
               who solved <2/3 weekend problems in the previous week)

Parameters:
  email     - (Optional) Test email address for start/reminder/both types.
              If omitted, queries database for active contests.
              Not applicable for 'reset'.

Examples:
  npx tsx --env-file=.env src/server/cron/test-email.ts start your@email.com
  npx tsx --env-file=.env src/server/cron/test-email.ts reminder your@email.com
  npx tsx --env-file=.env src/server/cron/test-email.ts both your@email.com
  npx tsx --env-file=.env src/server/cron/test-email.ts start
  npx tsx --env-file=.env src/server/cron/test-email.ts reset
      `);
      process.exit(1);
    }

    console.log("\n✅ Email test completed successfully!");
  } catch (error) {
    console.error("\n❌ Email test failed:", error);
    process.exit(1);
  }
}

void main();
