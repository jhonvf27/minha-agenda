export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json(null);

  const note = await prisma.eventNote.findUnique({ where: { eventId } });
  return NextResponse.json(note);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { eventId, content, checklist, color } = body;
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const note = await prisma.eventNote.upsert({
    where: { eventId },
    update: { content, checklist: JSON.stringify(checklist), color },
    create: { eventId, content, checklist: JSON.stringify(checklist), color },
  });

  return NextResponse.json({ ...note, checklist: JSON.parse(note.checklist) });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  await prisma.eventNote.deleteMany({ where: { eventId } });
  return NextResponse.json({ ok: true });
}
