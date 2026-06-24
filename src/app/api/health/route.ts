import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Liveness + database connectivity check. Used to verify the stack is wired up.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const userCount = await db.user.count();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      users: userCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
