import { useState, useEffect } from 'react';
import { GameRegistry } from '../../engine/GameRegistry';
import { usePlayerStore } from '../../stores/playerStore';
import { RoomEngine } from '../../multiplayer/RoomEngine';

interface PlayerCustomizationPanelProps {
  gameId: string;
  initialCustomization?: Record<string, any>;
  onCustomizationChange?: (customization: Record<string, any>) => void;
  standalone?: boolean; // If true, triggers RoomEngine.updateCustomization automatically
}

export function PlayerCustomizationPanel({ gameId, initialCustomization, onCustomizationChange, standalone = true }: PlayerCustomizationPanelProps) {
  const selectedGame = GameRegistry.get(gameId);
  const { player, settings, updateSettings } = usePlayerStore();
  
  const savedGameCustomization = (settings as any)?.customizations?.[gameId];

  const [customization, setCustomization] = useState<Record<string, any>>(() => {
    return initialCustomization || savedGameCustomization || selectedGame?.defaultCustomization || {};
  });

  useEffect(() => {
    let resolvedCustomization = {};
    if (initialCustomization && Object.keys(initialCustomization).length > 0) {
      resolvedCustomization = initialCustomization;
    } else if (savedGameCustomization && Object.keys(savedGameCustomization).length > 0) {
      resolvedCustomization = savedGameCustomization;
    } else if (selectedGame?.defaultCustomization) {
      resolvedCustomization = selectedGame.defaultCustomization;
    }
    
    setCustomization(resolvedCustomization);
    
    if (standalone && Object.keys(resolvedCustomization).length > 0) {
      RoomEngine.send({ type: 'PLAYER_CUSTOMIZATION_UPDATE', customization: resolvedCustomization });
    }
  }, [gameId, initialCustomization, selectedGame, standalone]);

  if (!selectedGame || !selectedGame.customizationSchema || selectedGame.customizationSchema.length === 0) {
    return null;
  }

  const handleChange = (key: string, value: any) => {
    const newCustomization = { ...customization, [key]: value };
    setCustomization(newCustomization);
    
    if (onCustomizationChange) {
      onCustomizationChange(newCustomization);
    }
    
    // Save to player settings persistence
    const currentCustomizations = (settings as any)?.customizations || {};
    updateSettings({
      customizations: { ...currentCustomizations, [gameId]: newCustomization }
    } as any);

    if (standalone) {
      RoomEngine.send({ type: 'PLAYER_CUSTOMIZATION_UPDATE', customization: newCustomization });
    }
  };

  const primaryColor = customization.primaryColor || '#22c55e';
  const secondaryColor = customization.secondaryColor || '#16a34a';
  const skin = customization.skin || 'classic';
  const trail = customization.trail || 'none';

  return (
    <div className="bg-surface-overlay border border-border-default rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎨</span>
          <h3 className="text-sm font-bold uppercase tracking-wider">Player Customization</h3>
        </div>
        <span className="text-xs text-text-muted">Changes apply instantly</span>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {selectedGame.customizationSchema.map(schema => {
          const value = customization[schema.key] ?? schema.defaultValue;
          
          if (schema.type === 'select') {
            return (
              <div key={schema.key} className="bg-surface-base p-3 rounded-xl border border-border-default">
                <div className="font-semibold text-sm mb-1">{schema.label}</div>
                <select
                  value={value}
                  onChange={(e) => handleChange(schema.key, e.target.value)}
                  className="w-full bg-surface-raised border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-hrsh-accent cursor-pointer"
                >
                  {schema.options?.map(opt => (
                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          }
          
          if (schema.type === 'color') {
            return (
              <div key={schema.key} className="bg-surface-base p-3 rounded-xl border border-border-default">
                <div className="font-semibold text-sm mb-1">{schema.label}</div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleChange(schema.key, e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-xs font-mono uppercase bg-surface-raised px-2.5 py-1 rounded-md border border-border-default font-bold">{value}</span>
                </div>
              </div>
            );
          }

          if (schema.type === 'toggle') {
            return (
              <label key={schema.key} className="flex justify-between items-center bg-surface-base p-3 rounded-xl border border-border-default cursor-pointer">
                <span className="font-semibold text-sm">{schema.label}</span>
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => handleChange(schema.key, e.target.checked)}
                  className="w-5 h-5 rounded border-border-default text-hrsh-accent focus:ring-hrsh-accent bg-surface-raised"
                />
              </label>
            );
          }

          return null;
        })}
      </div>
      
      {/* Dynamic Graphic Preview */}
      <div className="mt-4 pt-4 border-t border-border-default">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Live Preview</div>
          <div className="text-xs font-mono text-text-muted">{player?.name || 'Player'}</div>
        </div>

        <div className="flex items-center justify-center p-6 rounded-xl bg-surface-base border border-border-default relative overflow-hidden min-h-[120px]">
          {/* Snake / Snake Arena Preview */}
          {(gameId === 'snake' || gameId === 'snake-arena') && (
            <>
              {trail === 'glow' && (
                <div className="absolute inset-0 bg-radial from-hrsh-accent/10 to-transparent pointer-events-none animate-pulse" />
              )}
              {trail === 'rainbow' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-green-500/10 to-blue-500/10 pointer-events-none animate-pulse" />
              )}
              
              <div className="flex items-center gap-1.5 relative z-10">
                <div
                  className="w-5 h-5 rounded-md opacity-60 shadow-sm transition-all"
                  style={{
                    backgroundColor: secondaryColor,
                    filter: trail === 'glow' ? `drop-shadow(0 0 6px ${secondaryColor})` : undefined
                  }}
                />
                <div
                  className="w-6 h-6 rounded-md opacity-80 shadow-sm transition-all"
                  style={{
                    backgroundColor: secondaryColor,
                    filter: trail === 'glow' ? `drop-shadow(0 0 8px ${secondaryColor})` : undefined
                  }}
                />
                <div
                  className="w-7 h-7 rounded-lg opacity-95 shadow-md transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    filter: trail === 'glow' ? `drop-shadow(0 0 10px ${primaryColor})` : undefined
                  }}
                />
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg relative transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    filter: skin === 'neon' ? `drop-shadow(0 0 12px ${primaryColor})` : undefined,
                    border: skin === 'galaxy' ? '2px solid #c084fc' : skin === 'cyber' ? '2px solid #06b6d4' : undefined
                  }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 2048 Preview */}
          {gameId === '2048' && (
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 flex items-center justify-center font-bold text-lg text-white shadow-lg transition-all ${
                  customization.tileShape === 'pill' ? 'rounded-2xl' : customization.tileShape === 'square' ? 'rounded-none' : 'rounded-lg'
                }`}
                style={{
                  backgroundColor: customization.primaryColor || '#f59e0b',
                  boxShadow: customization.theme === 'neon' ? `0 0 16px ${customization.primaryColor || '#f59e0b'}` : undefined
                }}
              >
                2048
              </div>
              <div
                className={`w-12 h-12 flex items-center justify-center font-bold text-sm text-white/90 shadow-md opacity-80 transition-all ${
                  customization.tileShape === 'pill' ? 'rounded-2xl' : customization.tileShape === 'square' ? 'rounded-none' : 'rounded-lg'
                }`}
                style={{
                  backgroundColor: customization.primaryColor ? `${customization.primaryColor}cc` : '#ea580c'
                }}
              >
                1024
              </div>
            </div>
          )}

          {/* Reaction Test Preview */}
          {(gameId === 'reaction' || gameId === 'reaction-test') && (
            <div
              className="w-full max-w-xs py-4 px-6 rounded-xl flex items-center justify-center font-mono font-bold text-sm text-white shadow-md transition-all gap-2"
              style={{
                backgroundColor: customization.primaryColor || '#ef4444',
                boxShadow: `0 0 20px ${(customization.primaryColor || '#ef4444')}40`
              }}
            >
              {customization.targetStyle === 'bolt' ? '⚡' : customization.targetStyle === 'circle' ? '🎯' : '🔴'}
              <span>{customization.theme === 'cyber' ? 'CYBER READY' : 'WAIT FOR GREEN...'}</span>
            </div>
          )}

          {/* Minesweeper Preview */}
          {gameId === 'minesweeper' && (
            <div className="flex items-center gap-2">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-lg bg-surface-raised border border-border-default shadow-sm transition-all"
                style={{ borderColor: customization.primaryColor || '#6366f1' }}
              >
                {customization.flagStyle === 'warning' ? '⚠️' : customization.flagStyle === 'pin' ? '📍' : customization.flagStyle === 'skull' ? '💀' : '🚩'}
              </div>
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-lg bg-surface-raised border border-border-default shadow-sm transition-all"
                style={{ borderColor: customization.primaryColor || '#6366f1' }}
              >
                {customization.mineStyle === 'spike' ? '💥' : customization.mineStyle === 'hazard' ? '☣️' : '💣'}
              </div>
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm bg-surface-base border border-border-default"
                style={{ color: customization.primaryColor || '#6366f1' }}
              >
                3
              </div>
            </div>
          )}

          {/* Sudoku Preview */}
          {gameId === 'sudoku' && (
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-raised border border-border-default rounded-lg">
              <div className="w-8 h-8 flex items-center justify-center font-bold text-sm bg-surface-base text-text-primary rounded">5</div>
              <div
                className="w-8 h-8 flex items-center justify-center font-bold text-sm rounded shadow-sm text-white transition-all"
                style={{ backgroundColor: customization.primaryColor || '#0ea5e9' }}
              >
                3
              </div>
              <div className="w-8 h-8 flex items-center justify-center font-bold text-sm bg-surface-base text-text-primary rounded">8</div>
            </div>
          )}

          {/* Typing Preview */}
          {(gameId === 'typing' || gameId === 'typing-race' || gameId === 'typing-test') && (
            <div className="flex items-center gap-1 font-mono text-base">
              <span className="text-text-primary font-bold">The quick brown</span>
              <span
                className="px-1 py-0.5 rounded text-white font-bold transition-all"
                style={{
                  backgroundColor: customization.primaryColor || '#8b5cf6',
                  boxShadow: `0 0 10px ${customization.primaryColor || '#8b5cf6'}`
                }}
              >
                fox
              </span>
              <span
                className={`inline-block w-0.5 h-5 animate-pulse transition-all ${
                  customization.caretStyle === 'block' ? 'w-2 bg-text-primary' : customization.caretStyle === 'underline' ? 'w-3 h-0.5 self-end' : 'w-0.5'
                }`}
                style={{ backgroundColor: customization.primaryColor || '#8b5cf6' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

