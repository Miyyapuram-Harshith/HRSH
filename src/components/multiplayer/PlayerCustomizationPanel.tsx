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
  const { player } = usePlayerStore();
  
  const [customization, setCustomization] = useState<Record<string, any>>(
    initialCustomization || selectedGame?.defaultCustomization || {}
  );

  useEffect(() => {
    let resolvedCustomization = {};
    if (initialCustomization) {
      resolvedCustomization = initialCustomization;
      setCustomization(initialCustomization);
    } else if (selectedGame?.defaultCustomization) {
      resolvedCustomization = selectedGame.defaultCustomization;
      setCustomization(selectedGame.defaultCustomization);
    }
    
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
    
    if (standalone) {
      // Local debounced update to server
      RoomEngine.send({ type: 'PLAYER_CUSTOMIZATION_UPDATE', customization: newCustomization });
    }
  };

  return (
    <div className="bg-surface-overlay border border-border-default rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎨</span>
        <h3 className="text-sm font-bold uppercase tracking-wider">Player Customization</h3>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {selectedGame.customizationSchema.map(schema => {
          const value = customization[schema.key] ?? schema.defaultValue;
          
          if (schema.type === 'select') {
            return (
              <div key={schema.key} className="bg-surface-base p-3 rounded-xl border border-border-default">
                <div className="font-semibold text-sm mb-2">{schema.label}</div>
                <select
                  value={value}
                  onChange={(e) => handleChange(schema.key, e.target.value)}
                  className="w-full bg-surface-raised border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-hrsh-accent"
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
                <div className="font-semibold text-sm mb-2">{schema.label}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleChange(schema.key, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-xs font-mono uppercase">{value}</span>
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
      
      {/* Live Preview Placeholder (Could be augmented per game) */}
      <div className="mt-4 pt-4 border-t border-border-default text-center">
        <div className="text-xs text-text-muted mb-2">Live Preview</div>
        <div className="inline-flex items-center justify-center min-w-[120px] min-h-[40px] px-4 py-2 rounded-xl bg-surface-base border border-border-default shadow-inner">
           {customization.skin === 'neon' ? '✨' : customization.skin === 'galaxy' ? '🌌' : customization.skin === 'fire' ? '🔥' : '🐍'} 
           <span className="ml-2 font-bold" style={{ color: customization.primaryColor || '#22c55e' }}>{player?.name || 'Player'}</span>
        </div>
      </div>
    </div>
  );
}
