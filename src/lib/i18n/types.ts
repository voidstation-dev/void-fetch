import type en from './dictionaries/en.json';

export type Dictionary = typeof en;

declare global {
  // Use type safe message keys with next-intl
  interface IntlMessages extends Dictionary {}
}
