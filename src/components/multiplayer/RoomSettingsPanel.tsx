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
          <div key={schema.key}>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{schema.label}</label>
            <select
              value={value}
              onChange={(e) => {
                const opt = schema.options?.find(o => String(o.value) === String(e.target.value));
                if (opt) handleChange(opt.value);
                else handleChange(e.target.value);
              }}
              className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-hrsh-accent"
            >
              {schema.options?.map(opt => (
                <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      case 'slider':
        return (
          <div key={schema.key}>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{schema.label}</label>
            <input
              type="range"
              min={schema.min}
              max={schema.max}
              step={schema.step}
              value={Number(value)}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-full accent-hrsh-accent"
            />
            <div className="text-center text-sm font-medium mt-1">{value}</div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!selectedGame) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {mode === 'create' && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Game</label>
            <select
              value={gameId}
              onChange={(e) => {
                setGameId(e.target.value);
                const g = GameRegistry.get(e.target.value);
                if (g) {
                  setMaxPlayers(g.maxPlayers || 2);
                  setGameMode(g.modes[0]?.id || 'classic');
                  const defaultSettings: Record<string, any> = {};
                  g.settingsSchema?.forEach(schema => {
                    defaultSettings[schema.key] = schema.defaultValue;
                  });
                  setGameSettings(defaultSettings);
                }
              }}
              className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-hrsh-accent"
            >
              {multiplayerGames.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        )}

        {selectedGame.modes.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Mode</label>
            <div className="flex flex-wrap gap-2">
              {selectedGame.modes.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setGameMode(m.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    gameMode === m.id
                      ? 'bg-hrsh-accent text-white border-hrsh-accent'
                      : 'bg-surface-base text-text-secondary border-border-default hover:border-border-accent'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(selectedGame.maxPlayers || 2) > (selectedGame.minPlayers || 2) && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Max Players</label>
            <input
              type="range"
              min={Math.max(selectedGame.minPlayers || 2, playerCount)}
              max={selectedGame.maxPlayers || 8}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="w-full accent-hrsh-accent"
            />
            <div className="text-center text-sm font-medium mt-1">{maxPlayers} Players</div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Visibility</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`p-3 rounded-xl border text-sm text-center transition-colors ${
                visibility === 'private'
                  ? 'bg-surface-raised border-hrsh-accent text-text-primary'
                  : 'bg-surface-base border-border-default text-text-muted hover:border-border-accent'
              }`}
            >
              <div className="font-semibold mb-0.5">Private</div>
              <div className="text-[10px]">Invite link only</div>
            </button>
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`p-3 rounded-xl border text-sm text-center transition-colors ${
                visibility === 'public'
                  ? 'bg-surface-raised border-hrsh-accent text-text-primary'
                  : 'bg-surface-base border-border-default text-text-muted hover:border-border-accent'
              }`}
            >
              <div className="font-semibold mb-0.5">Public</div>
              <div className="text-[10px]">Listed on HRSH Live</div>
            </button>
          </div>
        </div>
        
        {mode === 'create' && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Friendly Match"
              maxLength={32}
              className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-hrsh-accent"
            />
          </div>
        )}

        {/* Dynamic Game Settings */}
        {selectedGame.settingsSchema && selectedGame.settingsSchema.length > 0 && (
          <div className="border-t border-border-default pt-4 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-2">Advanced Game Settings</h3>
            {selectedGame.settingsSchema.map(schema => renderGameSetting(schema))}
          </div>
        )}
      </div>

      <div className="border-t border-border-default pt-6 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={spectatorsAllowed}
            onChange={(e) => setSpectatorsAllowed(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-hrsh-accent focus:ring-hrsh-accent bg-surface-base"
          />
          <span className="text-sm">Allow Spectators</span>
        </label>
        
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => setAutoStart(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-hrsh-accent focus:ring-hrsh-accent bg-surface-base"
          />
          <span className="text-sm">Auto-start when full</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 py-3.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white font-semibold rounded-xl text-sm transition-all"
        >
          {mode === 'create' ? 'Create Room' : 'Save Changes'}
        </button>
        {mode === 'edit' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 bg-surface-base border border-border-default hover:bg-surface-raised font-semibold rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
