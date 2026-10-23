import { TwentyEightCarAdapter } from './twentyEightCar';
import { GloriousWebAdapter } from './gloriousWeb';
import { FacebookAdapter } from './facebook';
import type { SourceAdapter } from './types';

export type { ExternalComment, SourceAdapter } from './types';
export { TwentyEightCarAdapter, GloriousWebAdapter, FacebookAdapter };

export const adapters: SourceAdapter[] = [
  new TwentyEightCarAdapter(),
  new GloriousWebAdapter(),
  new FacebookAdapter(),
];

export function getAdapter(source: string): SourceAdapter | undefined {
  return adapters.find((a) => a.source === source);
}
