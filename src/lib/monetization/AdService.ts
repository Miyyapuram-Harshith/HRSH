// ============================================================
// HRSH — Ad Service (Abstraction Only)
// ============================================================
// Ad infrastructure abstraction. Disabled by default.
// No actual ad provider is loaded until configured.
// ============================================================

import type { AdSlotConfig, AdSlotPosition } from '../../types/engine';
import { usePlayerStore } from '../../stores/playerStore';

class AdServiceImpl {
  private enabled = false;
  private publisherId: string | null = null;

  configure(publisherId: string): void {
    this.publisherId = publisherId;
    this.enabled = true;
  }

  isEnabled(): boolean {
    const player = usePlayerStore.getState().player;
    if (player?.isPremium) return false;
    return this.enabled;
  }

  getPublisherId(): string | null {
    return this.publisherId;
  }

  getSlotConfig(position: AdSlotPosition): AdSlotConfig {
    const isPremium = usePlayerStore.getState().player?.isPremium;
    const isAdEnabled = this.enabled && !isPremium;

    // Default slot configurations — reserve space to prevent CLS
    const configs: Record<AdSlotPosition, AdSlotConfig> = {
      'homepage-top': { position: 'homepage-top', width: 728, height: 90, enabled: isAdEnabled },
      'homepage-mid': { position: 'homepage-mid', width: 336, height: 280, enabled: isAdEnabled },
      'game-info': { position: 'game-info', width: 336, height: 280, enabled: isAdEnabled },
      'results': { position: 'results', width: 336, height: 280, enabled: isAdEnabled },
      'leaderboard': { position: 'leaderboard', width: 336, height: 280, enabled: isAdEnabled },
      'profile': { position: 'profile', width: 336, height: 280, enabled: isAdEnabled },
    };
    return configs[position];
  }

  async showInterstitial(): Promise<boolean> {
    if (!this.isEnabled()) return true;

    return new Promise((resolve) => {
      // Simulate ad delay
      console.log('Showing interstitial ad...');
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.color = 'white';
      
      overlay.innerHTML = `
        <div style="margin-bottom: 20px; font-weight: bold; font-size: 24px;">Advertisement</div>
        <div style="width: 300px; height: 250px; background: #333; display: flex; align-items: center; justify-content: center; border: 1px solid #555;">
          [Simulated Ad Content]
        </div>
        <div style="margin-top: 20px; font-size: 14px; opacity: 0.7;">Closing in <span id="ad-timer">3</span>s...</div>
      `;
      
      document.body.appendChild(overlay);

      let timeLeft = 3;
      const timer = setInterval(() => {
        timeLeft--;
        const el = document.getElementById('ad-timer');
        if (el) el.innerText = timeLeft.toString();
        if (timeLeft <= 0) {
          clearInterval(timer);
          document.body.removeChild(overlay);
          resolve(true);
        }
      }, 1000);
    });
  }
}

export const AdService = new AdServiceImpl();

