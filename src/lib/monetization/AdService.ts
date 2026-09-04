// ============================================================
// HRSH — Ad Service (Abstraction Only)
// ============================================================
// Ad infrastructure abstraction. Disabled by default.
// No actual ad provider is loaded until configured.
// ============================================================

import type { AdSlotConfig, AdSlotPosition } from '../../types/engine';

class AdServiceImpl {
  private enabled = false;
  private publisherId: string | null = null;

  configure(publisherId: string): void {
    this.publisherId = publisherId;
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPublisherId(): string | null {
    return this.publisherId;
  }

  getSlotConfig(position: AdSlotPosition): AdSlotConfig {
    // Default slot configurations — reserve space to prevent CLS
    const configs: Record<AdSlotPosition, AdSlotConfig> = {
      'homepage-top': { position: 'homepage-top', width: 728, height: 90, enabled: this.enabled },
      'homepage-mid': { position: 'homepage-mid', width: 336, height: 280, enabled: this.enabled },
      'game-info': { position: 'game-info', width: 336, height: 280, enabled: this.enabled },
      'results': { position: 'results', width: 336, height: 280, enabled: this.enabled },
      'leaderboard': { position: 'leaderboard', width: 336, height: 280, enabled: this.enabled },
      'profile': { position: 'profile', width: 336, height: 280, enabled: this.enabled },
    };
    return configs[position];
  }
}

export const AdService = new AdServiceImpl();
