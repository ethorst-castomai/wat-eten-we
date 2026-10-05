import { NextResponse } from "next/server";
import { createDefaultData } from "@/lib/defaults";
import { handleWhatsAppReply } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/webhook  body: { "text": "2" }
 * Later: de webhook van de WhatsApp-provider. Die stuurt het antwoord van de gebruiker hierheen.
 * Prototype: werkt met het standaardprofiel en geeft het antwoord als JSON terug.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const res = handleWhatsAppReply({ text: body.text ?? "", data: createDefaultData() });
  return NextResponse.json({ reply: res.reply, chosenId: res.chosenId ?? null });
}
