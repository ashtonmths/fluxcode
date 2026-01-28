"use client";

import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface WeekProblem {
  id: string;
  title: string;
  difficulty: string;
  solved?: boolean;
}

interface WeekData {
  weekNumber: number;
  topic: string;
  weekdayHomework: WeekProblem[];
  weekendTest: {
    problems: WeekProblem[];
    timeLimit: string;
  };
  weekdaySolved: number;
  weekendSolved: number;
}

interface WeeklyProgressCardProps {
  week: WeekData;
  isWeekend: boolean;
}

export function WeeklyProgressCard({ week, isWeekend }: WeeklyProgressCardProps) {
  // Determine weekend test status color
  const getWeekendColor = () => {
    const solved = week.weekendSolved;
    if (solved === 0 || solved === 1) return "bg-red-500/10 border-red-500/30";
    if (solved === 2) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-green-500/10 border-green-500/30";
  };

  const getWeekendTextColor = () => {
    const solved = week.weekendSolved;
    if (solved === 0 || solved === 1) return "text-red-400";
    if (solved === 2) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            Week {week.weekNumber}
          </h3>
          <p className="text-sm text-gray-400">{week.topic}</p>
        </div>
        <Badge className="bg-purple-500/20 text-purple-400">
          {week.weekdaySolved + week.weekendSolved}/6 Solved
        </Badge>
      </div>

      {/* Weekday Homework - Always Blue */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="font-semibold text-white">Weekday Homework</span>
          <span className="text-sm text-gray-400">
            ({week.weekdaySolved}/3 solved)
          </span>
        </div>
        <div className="ml-5 space-y-2">
          {week.weekdayHomework.map((problem) => (
            <div
              key={problem.id}
              className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2"
            >
              <span className="text-sm text-white">{problem.title}</span>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    problem.difficulty === "Easy"
                      ? "bg-green-500/20 text-green-400"
                      : problem.difficulty === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }
                >
                  {problem.difficulty}
                </Badge>
                {problem.solved && (
                  <span className="text-blue-400">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekend Test - Color Coded */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              week.weekendSolved === 0 || week.weekendSolved === 1
                ? "bg-red-500"
                : week.weekendSolved === 2
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
          />
          <span className="font-semibold text-white">Weekend Test</span>
          <span className={`text-sm ${getWeekendTextColor()}`}>
            ({week.weekendSolved}/3 solved)
          </span>
          {week.weekendSolved < 2 && isWeekend && (
            <Badge className="bg-red-500/20 text-red-400">⚠️ Risk</Badge>
          )}
        </div>
        <div className="ml-5 space-y-2">
          {week.weekendTest.problems.map((problem) => (
            <div
              key={problem.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${getWeekendColor()}`}
            >
              <span className="text-sm text-white">{problem.title}</span>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    problem.difficulty === "Easy"
                      ? "bg-green-500/20 text-green-400"
                      : problem.difficulty === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }
                >
                  {problem.difficulty}
                </Badge>
                {problem.solved && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Time Limit: {week.weekendTest.timeLimit}</span>
            {week.weekendSolved < 2 && (
              <span className="text-red-400">
                Need 2/3 to avoid penalty
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
