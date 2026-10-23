import type { Source } from '../types';

/** Normalized comment pulled from an external source (not yet persisted). */
export interface ExternalComment {
  source: Source;
  author: string;
  content: string;
  external_id: string;
  url?: string;
  created_at?: string;
}

/**
 * Pluggable source adapter. Live implementations will fetch from
 * 28car, Glorious website, or Facebook Graph API later.
 */
export interface SourceAdapter {
  readonly source: Source;
  /** Fetch new/updated comments since optional cursor. Stub returns []. */
  fetchComments(since?: string): Promise<ExternalComment[]>;
}
