import type { WalletActivity } from '@/features/activity/types';
import type { SupportedChainId } from '@/shared/config/chains';

export type ExplorerActivityResult = {
  activities: WalletActivity[];
  error: string | null;
  skipped: boolean;
};

export async function fetchExplorerActivities(_: string, __: SupportedChainId): Promise<ExplorerActivityResult> {
  return {
    activities: [],
    error: null,
    skipped: true,
  };
}
