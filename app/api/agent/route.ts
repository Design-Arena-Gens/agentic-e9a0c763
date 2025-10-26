import { NextResponse } from "next/server";
import { enqueueAgentRun } from "@/lib/agent";
import { listJobs } from "@/lib/jobs";
import { z } from "zod";

const payloadSchema = z.object({
  topic: z.string().min(5).max(200),
  tone: z.string().default("Inspiring"),
  voice: z.string().default("Friendly narrator")
});

export async function GET() {
  const jobs = listJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const body = await request.json();
  const payload = payloadSchema.parse(body);
  const job = enqueueAgentRun(payload);
  return NextResponse.json({ job }, { status: 201 });
}
