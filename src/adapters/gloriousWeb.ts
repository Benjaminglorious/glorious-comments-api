import type { ExternalComment, SourceAdapter } from './types';

/**
 * Stub adapter for Glorious Motors (東榮汽車) official website contact / inquiry forms.
 * TODO: implement live fetch (CRM webhook, admin export, or form backend).
 */
export class GloriousWebAdapter implements SourceAdapter {
  readonly source = 'glorious_web' as const;

  async fetchComments(_since?: string): Promise<ExternalComment[]> {
    // TODO: live integration
    return [];
  }
}
