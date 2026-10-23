import type { ExternalComment, SourceAdapter } from './types';

/**
 * Stub adapter for 28car.com customer inquiries / forum posts.
 * TODO: implement live fetch (official API, export, or approved scrape).
 */
export class TwentyEightCarAdapter implements SourceAdapter {
  readonly source = '28car' as const;

  async fetchComments(_since?: string): Promise<ExternalComment[]> {
    // TODO: live integration
    return [];
  }
}
