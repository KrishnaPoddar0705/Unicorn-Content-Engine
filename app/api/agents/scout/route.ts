import { NextResponse } from "next/server";
import { scoutResearch } from "@/lib/agents/research-scout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await scoutResearch({
      topics: body.topics,
      pillar: body.pillar,
      count: body.count || 5,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
