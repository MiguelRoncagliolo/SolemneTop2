import { ScraperScheduleType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { shouldRunBySetting } from "./schedule";

describe("shouldRunBySetting", () => {
  it("runs interval schedule when enough time elapsed", () => {
    const now = new Date("2026-05-01T12:00:00.000Z");
    const setting = {
      isActive: true,
      scheduleType: ScraperScheduleType.interval,
      intervalHours: 2,
    } as const;
    const lastRun = { startTime: new Date("2026-05-01T09:30:00.000Z") } as const;
    expect(shouldRunBySetting(setting as never, lastRun as never, now)).toBe(true);
  });

  it("does not run when paused", () => {
    const setting = {
      isActive: true,
      scheduleType: ScraperScheduleType.paused,
    } as const;
    expect(shouldRunBySetting(setting as never, null, new Date())).toBe(false);
  });
});
