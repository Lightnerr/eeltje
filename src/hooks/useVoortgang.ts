import { useSyncExternalStore } from 'react';
import { opslag } from '../lib/storage';
import type { Voortgang } from '../lib/types';

export function useVoortgang(): Voortgang {
  return useSyncExternalStore(opslag.abonneer, opslag.get, opslag.get);
}
