import ca from "../messages/ca.json";
import en from "../messages/en.json";
import es from "../messages/es.json";
export const messages = { ca, es, en } as const;
export type MessageKey = keyof typeof ca;
