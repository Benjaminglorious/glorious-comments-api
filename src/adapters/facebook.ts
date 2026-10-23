import type { ExternalComment, SourceAdapter } from './types';

/**
 * Stub adapter for Facebook Page comments / Messenger.
 * TODO: implement via Facebook Graph API with page access token (never hardcode secrets).
 */
export class FacebookAdapter implements SourceAdapter {
  readonly source = 'facebook' as const;

  async fetchComments(_since?: string): Promise<ExternalComment[]> {
    // TODO: live Graph API integration
    return [];
  }
}
