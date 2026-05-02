import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const validation = await prisma.mvtValidation.findUnique({
    where: { id },
    include: {
      proposal: {
        select: {
          title: true,
          firstMvtSuggestion: true,
        },
      },
      interviews: {
        orderBy: { interviewDate: "desc" },
      },
      assumptions: {
        orderBy: { createdAt: "asc" },
      },
      tests: {
        include: {
          results: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!validation) {
    return NextResponse.json({ ok: false, message: "Validation not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, validation });
}
