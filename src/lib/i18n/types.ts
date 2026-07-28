import type en from './dictionaries/en.json';

export type Dictionary = typeof en;

declare global {
  // Use type safe message keys with next-intl
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Dictionary {}
}
