import { NextResponse } from "next/server";

import { proposalsStatus, triggerProposalGeneration } from "@/lib/proposals/runner";

export async function POST() {
  if (proposalsStatus().running) {
    return NextResponse.json(
      { ok: false, message: "Proposal generation already running." },
      { status: 409 },
    );
  }

  try {
    await triggerProposalGeneration();
    return NextResponse.json({ ok: true, message: "Proposals generated." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proposal generation error";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
