import { messages } from "@obrametrik/i18n";
import { getLocales } from "expo-localization";

export type AppLocale = keyof typeof messages;

export function getDeviceLocale(): AppLocale {
  const language = getLocales()[0]?.languageCode;
  return language === "es" || language === "en" ? language : "ca";
}
