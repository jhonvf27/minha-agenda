import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 400 });
  }

  const { type, events, date } = await req.json();

  const eventsText = (events as { title: string; start: string; end?: string }[])
    .map((e) => `• ${e.title} (${e.start}${e.end ? " → " + e.end : ""})`)
    .join("\n");

  let prompt = "";

  if (type === "summary") {
    prompt = `Você é um assistente de agenda pessoal. Analise os eventos do dia ${date} e escreva um resumo amigável e motivador em português brasileiro, em 2-3 parágrafos curtos. Destaque o que foi produtivo, padrões interessantes e uma observação encorajadora. Seja direto e pessoal.

Eventos do dia:
${eventsText || "Nenhum evento registrado."}`;
  } else if (type === "suggest") {
    prompt = `Você é um assistente de agenda pessoal. Analise os eventos de hoje (${date}) e sugira os melhores horários livres para novas tarefas. Liste de 3 a 5 janelas de tempo disponíveis com sugestão de uso (ex: foco profundo, exercício, reuniões). Seja prático e direto em português brasileiro.

Eventos de hoje:
${eventsText || "Dia completamente livre!"}`;
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("credit balance")) {
      return NextResponse.json({ error: "Saldo de créditos insuficiente. Acesse console.anthropic.com → Plans & Billing para adicionar créditos." }, { status: 402 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
