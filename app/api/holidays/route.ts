import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();

  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/BR`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) return NextResponse.json([]);
  const data = await res.json();
  return NextResponse.json(data);
}
