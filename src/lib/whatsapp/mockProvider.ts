import type { WhatsAppProvider } from "./types";

/** Doet alsof er verstuurd wordt. Handig voor het prototype en voor tests. */
export class MockWhatsAppProvider implements WhatsAppProvider {
  public sent: { to: string; body: string; at: string }[] = [];

  async sendMessage(to: string, body: string) {
    this.sent.push({ to, body, at: new Date().toISOString() });
    if (typeof console !== "undefined") console.info(`[WhatsApp mock] naar ${to}:\n${body}`);
    return { ok: true, id: `mock-${this.sent.length}` };
  }
}
