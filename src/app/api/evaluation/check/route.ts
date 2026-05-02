import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRubricSnapshot } from "@/lib/evaluation/rubric";

export async function GET() {
  const snapshot = await getRubricSnapshot(prisma);
  return NextResponse.json(snapshot);
}
