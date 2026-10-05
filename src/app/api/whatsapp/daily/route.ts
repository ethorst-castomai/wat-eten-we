import { NextResponse } from "next/server";
import { createDefaultData } from "@/lib/defaults";
import { sendDailyWhatsAppRecipes } from "@/lib/whatsapp";

/**
 * GET /api/whatsapp/daily
 * Aan te roepen door een dagelijkse cron (bijvoorbeeld Vercel Cron om 08:00).
 * Prototype: gebruikt het standaardprofiel, omdat localStorage niet op de server bestaat.
 * Met Supabase laad je hier de data van het huishouden en sla je de selectie op.
 */
export async function GET() {
  const data = createDefaultData();
  const res = await sendDailyWhatsAppRecipes({
    data,
    recipient: { name: "Erwin", phone: process.env.WHATSAPP_TO ?? "+31600000000" },
  });
  return NextResponse.json({ message: res.message, recipeIds: res.selection.recipeIds, delivered: res.delivered });
}
