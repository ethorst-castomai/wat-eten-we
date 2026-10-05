import type { AppData, DailySelection } from "../types";
import { getOrCreateSelection, selectionRecipes, upsertSelection } from "../daily";
import { buildDailyMessage, buildRecipeMessage, buildShoppingMessage } from "./messages";
import { MockWhatsAppProvider } from "./mockProvider";
import { countPersons, countVegetarians } from "../defaults";
import type { WhatsAppProvider, WhatsAppRecipient } from "./types";

export const defaultProvider: WhatsAppProvider = new MockWhatsAppProvider();

export interface DailySendResult {
  message: string;
  selection: DailySelection;
  /** Bijgewerkte data die de aanroeper moet opslaan (de selectie van vandaag) */
  data: AppData;
  delivered: boolean;
}

/**
 * Stelt het ochtendbericht samen en verstuurt het via de provider.
 * Bedoeld om iedere ochtend vanuit een cron job (bijvoorbeeld Vercel Cron of Supabase Edge Function) aan te roepen.
 * In het prototype wordt de MockWhatsAppProvider gebruikt, die niets echt verstuurt.
 */
export async function sendDailyWhatsAppRecipes(params: {
  data: AppData;
  recipient: WhatsAppRecipient;
  provider?: WhatsAppProvider;
  date?: Date;
}): Promise<DailySendResult> {
  const { data, recipient, provider = defaultProvider, date = new Date() } = params;
  const { selection } = getOrCreateSelection(data, date);
  const message = buildDailyMessage(recipient.name, selectionRecipes(selection), (r) => countVegetarians(data, r));
  const res = await provider.sendMessage(recipient.phone, message);
  return {
    message,
    selection,
    data: { ...data, selections: upsertSelection(data.selections, selection) },
    delivered: res.ok,
  };
}

export interface ReplyResult {
  reply: string;
  /** Gekozen recept, of undefined als het antwoord niet herkend werd */
  chosenId?: string;
  data: AppData;
}

/**
 * Verwerkt een inkomend WhatsApp-antwoord ("1", "2" of "3").
 * Geeft het volledige recept en de boodschappenlijst terug en markeert de keuze voor vandaag.
 */
export function handleWhatsAppReply(params: { text: string; data: AppData; date?: Date }): ReplyResult {
  const { text, data, date = new Date() } = params;
  const { selection } = getOrCreateSelection(data, date);
  const options = selectionRecipes(selection);
  const match = text.trim().match(/^[123]\b/);
  if (!match) {
    return { reply: "Antwoord met 1, 2 of 3 om een recept te kiezen.", data };
  }
  const recipe = options[Number(match[0]) - 1];
  if (!recipe) return { reply: "Die optie bestaat vandaag niet. Kies 1, 2 of 3.", data };
  const persons = countPersons(data);
  const veg = countVegetarians(data, recipe);
  const reply = [`Top, dan staat dit vanavond op het menu.`, "", buildRecipeMessage(recipe, persons, veg), "", buildShoppingMessage(recipe, persons, veg)].join("\n");
  const updated: DailySelection = { ...selection, chosenId: recipe.id };
  return { reply, chosenId: recipe.id, data: { ...data, selections: upsertSelection(data.selections, updated) } };
}
