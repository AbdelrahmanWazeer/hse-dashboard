import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { en, ar, locales, defaultLocale, type Locale, type Messages } from "./messages";

export const LOCALE_COOKIE = "locale";

export { locales, defaultLocale, en, ar };
export type { Locale, Messages };

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "ar";
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
});

export async function getLocaleInfo(): Promise<{ locale: Locale; dir: "ltr" | "rtl" }> {
  const locale = await getLocale();
  return { locale, dir: dirOf(locale) };
}

export const getDictionary = cache(async (): Promise<Messages> => {
  const locale = await getLocale();
  return locale === "ar" ? ar : en;
});

export type Dictionary = Messages;

export type TranslateFn = (en: string, ar: string) => string;

export const getT = cache(async (): Promise<TranslateFn> => {
  const locale = await getLocale();
  const tr: TranslateFn = (enText, arText) => (locale === "ar" ? arText : enText);
  return tr;
});

export function tl(locale: Locale): TranslateFn {
  const tr: TranslateFn = (enText, arText) => (locale === "ar" ? arText : enText);
  return tr;
}