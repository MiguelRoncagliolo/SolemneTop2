import { ScraperScheduleType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const settingsUpdateSchema = z.object({
  channelId: z.string().uuid(),
  scheduleType: z.nativeEnum(ScraperScheduleType),
  intervalHours: z.number().int().min(1).max(168).nullable().optional(),
  dailyTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  weeklyDay: z.number().int().min(0).max(6).nullable().optional(),
  weeklyTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  timezone: z.string().min(2).max(64).optional(),
  isActive: z.boolean(),
});

export async function GET() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      youtubeChannelId: true,
      handle: true,
      scraperSetting: true,
    },
  });

  return NextResponse.json({ channels });
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const parsed = settingsUpdateSchema.parse(payload);

    const updated = await prisma.scraperSetting.upsert({
      where: { channelId: parsed.channelId },
      update: {
        scheduleType: parsed.scheduleType,
        intervalHours: parsed.intervalHours ?? null,
        dailyTime: parsed.dailyTime ?? null,
        weeklyDay: parsed.weeklyDay ?? null,
        weeklyTime: parsed.weeklyTime ?? null,
        timezone: parsed.timezone ?? "America/Santiago",
        isActive: parsed.isActive,
      },
      create: {
        channelId: parsed.channelId,
        scheduleType: parsed.scheduleType,
        intervalHours: parsed.intervalHours ?? null,
        dailyTime: parsed.dailyTime ?? null,
        weeklyDay: parsed.weeklyDay ?? null,
        weeklyTime: parsed.weeklyTime ?? null,
        timezone: parsed.timezone ?? "America/Santiago",
        isActive: parsed.isActive,
      },
    });

    return NextResponse.json({ ok: true, settings: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid settings";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
