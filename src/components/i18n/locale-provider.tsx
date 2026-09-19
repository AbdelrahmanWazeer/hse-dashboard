"use client";

import * as React from "react";
import { en, ar, defaultLocale, type Locale, type Messages } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Messages;
  tr: (en: string, ar: string) => string;
};

const LocaleContext = React.createContext<LocaleContextValue>({
  locale: defaultLocale,
  dir: "ltr",
  t: en,
  tr: (enText) => enText,
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: locale === "ar" ? ar : en,
      tr: (enText, arText) => (locale === "ar" ? arText : enText),
    }),
    [locale]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return React.useContext(LocaleContext);
}