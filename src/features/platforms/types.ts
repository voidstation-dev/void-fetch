import { MediaMetadata } from "../batch-download/types/batch-download";

export interface PlatformConfig {
  id: string;
  name: string;
  matchUrl: (url: URL) => boolean;
  ui: {
    badgeColor: string;
  };
  buildFallbackMetadata?: (url: string) => MediaMetadata | null;
}
