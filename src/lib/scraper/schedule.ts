import { ScraperScheduleType, type ScraperRun, type ScraperSetting } from "@prisma/client";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

function parseTimeToHoursMinutes(value: string): { hour: number; minute: number } | null {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return { hour: hours, minute: minutes };
}

export function shouldRunBySetting(
  setting: ScraperSetting,
  lastRun: ScraperRun | null,
  now = new Date(),
): boolean {
  if (!setting.isActive || setting.scheduleType === ScraperScheduleType.paused) {
    return false;
  }

  if (setting.scheduleType === ScraperScheduleType.interval) {
    if (!setting.intervalHours) {
      return false;
    }
    if (!lastRun?.startTime) {
      return true;
    }

    const elapsedMs = now.getTime() - lastRun.startTime.getTime();
    return elapsedMs >= setting.intervalHours * 60 * 60 * 1000;
  }

  const timezone = setting.timezone || "America/Santiago";
  const nowInZone = toZonedTime(now, timezone);

  if (setting.scheduleType === ScraperScheduleType.daily) {
    if (!setting.dailyTime) {
      return false;
    }

    const parsed = parseTimeToHoursMinutes(setting.dailyTime);
    if (!parsed) {
      return false;
    }

    const localDate = formatInTimeZone(now, timezone, "yyyy-MM-dd");
    const scheduledUtc = fromZonedTime(
      `${localDate}T${setting.dailyTime}:00`,
      timezone,
    );

    if (now < scheduledUtc) {
      return false;
    }
    return !lastRun || lastRun.startTime < scheduledUtc;
  }

  if (setting.scheduleType === ScraperScheduleType.weekly) {
    if (!setting.weeklyTime || setting.weeklyDay === null) {
      return false;
    }

    const parsed = parseTimeToHoursMinutes(setting.weeklyTime);
    if (!parsed) {
      return false;
    }

    const currentDay = nowInZone.getDay();
    if (currentDay !== setting.weeklyDay) {
      return false;
    }

    const localDate = formatInTimeZone(now, timezone, "yyyy-MM-dd");
    const scheduledUtc = fromZonedTime(
      `${localDate}T${setting.weeklyTime}:00`,
      timezone,
    );

    if (now < scheduledUtc) {
      return false;
    }
    return !lastRun || lastRun.startTime < scheduledUtc;
  }

  return false;
}
