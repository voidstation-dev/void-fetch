import type { Locale } from "./config";
import type { Dictionary } from "./types";

// Dynamic loaders to avoid bundling all localized JSON dictionaries into the main JS payload.
// This splits translation files into separate, lazy-loaded chunks.
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () =>
    import("./dictionaries/en.json").then((m) => m.default as Dictionary),
  zh: () =>
    import("./dictionaries/zh.json").then((m) => m.default as Dictionary),
  "zh-tw": () =>
    import("./dictionaries/zh-tw.json").then((m) => m.default as Dictionary),
  ja: () =>
    import("./dictionaries/ja.json").then((m) => m.default as Dictionary),
  es: () =>
    import("./dictionaries/es.json").then((m) => m.default as Dictionary),
  ru: () =>
    import("./dictionaries/ru.json").then((m) => m.default as Dictionary),
  vi: () =>
    import("./dictionaries/vi.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const load = loaders[locale] || loaders.en;
  return load();
}
