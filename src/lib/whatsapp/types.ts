/** Abstractie voor een WhatsApp-provider, bijvoorbeeld Twilio of de WhatsApp Cloud API van Meta. */
export interface WhatsAppProvider {
  sendMessage(to: string, body: string): Promise<{ ok: boolean; id?: string }>;
}

export interface WhatsAppRecipient {
  name: string;
  /** Telefoonnummer in E.164 formaat, bijvoorbeeld +316xxxxxxxx */
  phone: string;
}
