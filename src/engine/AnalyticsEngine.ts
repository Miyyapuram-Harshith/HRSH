// ============================================================
// HRSH — Analytics Engine
// ============================================================
// Lightweight event tracking abstraction. Uses console in dev,
// designed to be connected to a real analytics backend later.
// ============================================================

import type { AnalyticsEventType } from '../types/engine';

interface AnalyticsProvider {
  track(event: AnalyticsEventType, data?: Record<string, unknown>): void;
}

class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEventType, data?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${event}`, data || '');
    }
  }
}

class AnalyticsEngineImpl {
  private provider: AnalyticsProvider = new ConsoleAnalyticsProvider();

  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  track(event: AnalyticsEventType, data?: Record<string, unknown>): void {
    this.provider.track(event, data);
  }
}

export const AnalyticsEngine = new AnalyticsEngineImpl();
