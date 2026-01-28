import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  updateProfile: publicProcedure
    .input(z.object({
      userId: z.string(),
      linkedinUsername: z.string().optional(),
      leetcodeUsername: z.string().optional(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          linkedinUsername: input.linkedinUsername,
          leetcodeUsername: input.leetcodeUsername,
          name: input.name,
          onboardingCompleted: true,
        },
      });
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          progress: {
            where: { completed: true },
            include: {
              problem: true,
              topic: true,
            },
          },
          streaks: true,
          achievements: {
            include: {
              badge: true,
            },
          },
          participations: {
            include: {
              contest: true,
            },
          },
        },
      });

      return user;
    }),

  getNotifications: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.notification.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  markNotificationRead: protectedProcedure
    .input(z.object({ userId: z.string(),  notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      });
    }),

  getAchievements: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userAchievement.findMany({
        where: { userId: input.userId },
        include: {
          badge: true,
        },
        orderBy: { earnedAt: "desc" },
      });
    }),

  getStreak: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const streak = await ctx.db.streak.findUnique({
        where: { userId: input.userId },
      });

      if (!streak) {
        return null;
      }

      // Check if user missed a day
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActive = new Date(streak.lastActiveAt);
      const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
      
      const daysDiff = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
      
      // If more than 1 day has passed, reset streak to 0
      if (daysDiff > 1) {
        return ctx.db.streak.update({
          where: { userId: input.userId },
          data: {
            currentStreak: 0,
            lastActiveAt: now,
          },
        });
      }

      return streak;
    }),

  useStreakFreeze: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const streak = await ctx.db.streak.findUnique({
        where: { userId: input.userId },
      });

      if (!streak || streak.freezesLeft <= 0) {
        throw new Error("No freezes available");
      }

      return ctx.db.streak.update({
        where: { userId: input.userId },
        data: {
          freezesLeft: { decrement: 1 },
          lastActiveAt: new Date(),
        },
      });
    }),

  searchUsers: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.query.length < 3) {
        return [];
      }

      return ctx.db.user.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { email: { contains: input.query, mode: "insensitive" } },
            { leetcodeUsername: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          leetcodeUsername: true,
          image: true,
        },
        take: 10,
      });
    }),
});
