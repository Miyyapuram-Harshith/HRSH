import { useState, useEffect } from 'react';
import { GameRegistry } from '../../engine/GameRegistry';
import type { GameSettingDefinition } from '../../types/game';

interface RoomSettingsPanelProps {
  mode: 'create' | 'edit';
  initialSettings?: any;
  onSubmit: (settings: any) => void;
  onCancel?: () => void;
  playerCount?: number;
}

export function RoomSettingsPanel({ mode, initialSettings, onSubmit, onCancel, playerCount = 1 }: RoomSettingsPanelProps) {
  const multiplayerGames = GameRegistry.getMultiplayer();
  
  const [gameId, setGameId] = useState(initialSettings?.gameId || (multiplayerGames[0]?.id || ''));
  const [gameMode, setGameMode] = useState(initialSettings?.mode || 'classic');
  const [maxPlayers, setMaxPlayers] = useState(initialSettings?.maxPlayers || 2);
  const [visibility, setVisibility] = useState(initialSettings?.visibility || 'private');
  const [roomName, setRoomName] = useState(initialSettings?.roomName || '');
  const [spectatorsAllowed, setSpectatorsAllowed] = useState(initialSettings?.spectatorsAllowed ?? true);
  const [autoStart, setAutoStart] = useState(initialSettings?.autoStartWhenFull ?? false);
  const [gameSettings, setGameSettings] = useState<Record<string, any>>(initialSettings?.gameSettings || {});

  const selectedGame = GameRegistry.get(gameId);

  // Initialize game settings if missing when game changes
  useEffect(() => {
    if (selectedGame && !initialSettings?.gameSettings) {
      const defaultSettings: Record<string, any> = {};
      selectedGame.settingsSchema?.forEach(schema => {
        defaultSettings[schema.key] = schema.defaultValue;
      });
      setGameSettings(prev => Object.keys(prev).length === 0 ? defaultSettings : prev);
    }
  }, [selectedGame, initialSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      gameId,
      mode: gameMode,
      maxPlayers,
      visibility,
      roomName,
      spectatorsAllowed,
      autoStartWhenFull: autoStart,
      countdownSeconds: 3,
      rematchSameRoom: true,
      gameSettings
    });
  };

  const renderGameSetting = (schema: GameSettingDefinition) => {
    const value = gameSettings[schema.key] ?? schema.defaultValue;
    const handleChange = (newVal: any) => {
      setGameSettings(prev => ({ ...prev, [schema.key]: newVal }));
    };

    switch (schema.type) {
      case 'select':
        return (
          <div key={schema.key} className="flex justify-between items-center bg-surface-base p-3 rounded-xl border border-border-default">
            <div>
              <div className="font-semibold text-sm text-text-primary">{schema.label}</div>
              {schema.description && <div className="text-[10px] text-text-muted mt-0.5">{schema.description}</div>}
            </div>
            <select
              value={value}
              onChange={(e) => {
                const opt = schema.options?.find(o => String(o.value) === String(e.target.value));
                if (opt) handleChange(opt.value);
                else handleChange(e.target.value);
              }}
              className="bg-surface-raised border border-border-default rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-hrsh-accent min-w-[120px]"
            >
              {schema.options?.map(opt => (
                <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      case 'slider':
      case 'number':
        return (
          <div key={schema.key} className="bg-surface-base p-4 rounded-xl border border-border-default">
            <div className="flex justify-between items-center mb-3">
              <div className="font-semibold text-sm text-text-primary">{schema.label}</div>
              <div className="text-sm font-bold text-hrsh-accent">{value}</div>
            </div>
            <input
              type="range"
              min={schema.min}
              max={schema.max}
              step={schema.step}
              value={Number(value)}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-full accent-hrsh-accent"
            />
          </div>
        );
      case 'toggle':
        return (
          <label key={schema.key} className="flex justify-between items-center bg-surface-base p-4 rounded-xl border border-border-default cursor-pointer">
            <div>
              <div className="font-semibold text-sm text-text-primary">{schema.label}</div>
              {schema.description && <div className="text-[10px] text-text-muted mt-0.5">{schema.description}</div>}
            </div>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-5 h-5 rounded border-border-default text-hrsh-accent focus:ring-hrsh-accent bg-surface-raised"
            />
          </label>
        );
      default:
        return null;
    }
  };

  if (!selectedGame) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* SECTION 1: GAME & ROOM NAME */}
      <div className="space-y-4">
        {mode === 'create' && (
          <div className="bg-surface-overlay border border-border-default rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Game</h3>
            <select
              value={gameId}
              onChange={(e) => {
                setGameId(e.target.value);
                const g = GameRegistry.get(e.target.value);
                if (g) {
                  setMaxPlayers(g.defaultMaxPlayers || g.maxPlayers || 2);
                  setGameMode(g.modes[0]?.id || 'classic');
                  const defaultSettings: Record<string, any> = {};
                  g.settingsSchema?.forEach(schema => {
                    defaultSettings[schema.key] = schema.defaultValue;
                  });
                  setGameSettings(defaultSettings);
                }
              }}
              className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:border-hrsh-accent"
            >
              {multiplayerGames.map(g => (
                <option key={g.id} value={g.id}>{g.icon} {g.title}</option>
              ))}
            </select>

            <div>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room Name"
                maxLength={32}
                className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-hrsh-accent"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: MODE & PLAYERS */}
      <div className="bg-surface-overlay border border-border-default rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Mode & Players</h3>
        
        {selectedGame.modes.length > 1 && (
          <div>
            <div className="flex gap-2 p-1 bg-surface-base border border-border-default rounded-xl">
              {selectedGame.modes.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setGameMode(m.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    gameMode === m.id
                      ? 'bg-hrsh-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(selectedGame.maxPlayers || 2) > (selectedGame.minPlayers || 2) && (
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Max Players</span>
              <span className="text-sm font-bold text-hrsh-accent bg-hrsh-accent/10 px-2 py-0.5 rounded-md">{maxPlayers}</span>
            </div>
            <input
              type="range"
              min={Math.max(selectedGame.minPlayers || 2, playerCount)}
              max={selectedGame.maxPlayers || 8}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="w-full accent-hrsh-accent"
            />
          </div>
        )}
      </div>

      {/* SECTION 3: PRIVACY & RULES */}
      <div className="bg-surface-overlay border border-border-default rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Privacy & Rules</h3>
        
        <div className="grid grid-cols-3 gap-2">
          {['private', 'unlisted', 'public'].map(vis => (
            <button
              key={vis}
              type="button"
              onClick={() => setVisibility(vis as any)}
              className={`p-2 rounded-xl border text-center transition-all ${
                visibility === vis
                  ? 'bg-surface-raised border-hrsh-accent text-hrsh-accent shadow-sm'
                  : 'bg-surface-base border-border-default text-text-muted hover:border-border-accent'
              }`}
            >
              <div className="text-xs font-bold uppercase">{vis}</div>
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex justify-between items-center bg-surface-base p-3 rounded-xl border border-border-default cursor-pointer hover:border-hrsh-accent/50 transition-colors">
            <span className="text-sm font-semibold text-text-primary">Allow Spectators</span>
            <input
              type="checkbox"
              checked={spectatorsAllowed}
              onChange={(e) => setSpectatorsAllowed(e.target.checked)}
              className="w-5 h-5 rounded border-border-default text-hrsh-accent focus:ring-hrsh-accent bg-surface-raised"
            />
          </label>
          
          <label className="flex justify-between items-center bg-surface-base p-3 rounded-xl border border-border-default cursor-pointer hover:border-hrsh-accent/50 transition-colors">
            <span className="text-sm font-semibold text-text-primary">Auto-start when full</span>
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="w-5 h-5 rounded border-border-default text-hrsh-accent focus:ring-hrsh-accent bg-surface-raised"
            />
          </label>
        </div>
      </div>

      {/* SECTION 4: GAME SETTINGS */}
      {selectedGame.settingsSchema && selectedGame.settingsSchema.length > 0 && (
        <div className="bg-surface-overlay border border-border-default rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Game Settings</h3>
          <div className="space-y-3">
            {selectedGame.settingsSchema.map(schema => renderGameSetting(schema))}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 py-4 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-hrsh-accent/20 active:scale-[0.98]"
        >
          {mode === 'create' ? 'Create Room' : 'Save Changes'}
        </button>
        {mode === 'edit' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-4 bg-surface-base border border-border-default hover:bg-surface-raised font-bold rounded-2xl text-base transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
