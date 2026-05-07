import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NOTE_ID = "singleton";

export async function GET() {
  const note = await prisma.quickNote.findFirst();
  return NextResponse.json({ content: note?.content ?? "" });
}

export async function PUT(req: Request) {
  const { content } = await req.json();
  const note = await prisma.quickNote.upsert({
    where: { id: NOTE_ID },
    update: { content },
    create: { id: NOTE_ID, content },
  });
  return NextResponse.json(note);
}
