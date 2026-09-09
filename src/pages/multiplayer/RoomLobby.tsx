import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';
import { RoomEngine } from '../../multiplayer/RoomEngine';
import { GameRegistry } from '../../engine/GameRegistry';
import { getGameComponent } from '../../utils/gameCache';
import { RoomSettingsPanel } from '../../components/multiplayer/RoomSettingsPanel';
import { PlayerCustomizationPanel } from '../../components/multiplayer/PlayerCustomizationPanel';
import { PlayerCard } from '../../components/ui/PlayerCard';
import { MultiplayerResultScreen } from '../../components/multiplayer/MultiplayerResultScreen';

export default function RoomLobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { player } = usePlayerStore();
  
  const room = useRoomStore();
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (roomId && player) {
      const searchParams = new URLSearchParams(location.search);
      const requestedTeamCode = searchParams.get('team');
      RoomEngine.connect(roomId.toUpperCase(), requestedTeamCode);
    }
    return () => {
      RoomEngine.disconnect();
    };
  }, [roomId, player, location.search]);

  // Room settings are now applied immediately during ROOM_JOIN via RoomEngine using sessionStorage.
  // We no longer need to rely on location.state.
  
  const me = room.players.find(p => p.id === player?.id);
  const isHost = me?.isHost || false;
  
  const game = useMemo(() => {
    return room.settings?.gameId ? GameRegistry.get(room.settings.gameId) : null;
  }, [room.settings?.gameId]);

  const GameComponent = game ? getGameComponent(game) : null;

  const handleCopyLink = async () => {
    const canonicalUrl = `${window.location.origin}/room/${roomId?.toUpperCase()}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my HRSH Room',
          text: `Play ${game?.title || 'a game'} with me on HRSH!`,
          url: canonicalUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if user cancels or it fails
      }
    }
    
    navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-5xl mb-4">🚪</div>
        <h1 className="text-2xl font-bold mb-2">Invalid Room</h1>
        <p className="text-text-muted mb-8 max-w-md">No room code was provided in the URL.</p>
        <button onClick={() => navigate('/multiplayer')} className="px-6 py-3 bg-hrsh-accent text-white hover:bg-hrsh-accent-hover rounded-xl font-semibold text-sm transition-colors">
          Browse Multiplayer
        </button>
      </div>
    );
  }

  if (room.connectionState === 'ERROR' || room.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-5xl mb-4">🚪</div>
        <h1 className="text-2xl font-bold mb-2">Room Unavailable</h1>
        <p className="text-text-muted mb-8 max-w-md">
          {room.error || "We couldn't connect to the room. It may have expired or the code might be incorrect."}
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate('/multiplayer')} className="px-6 py-3 bg-hrsh-accent text-white hover:bg-hrsh-accent-hover rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-hrsh-accent/20">
            Join Another Room
          </button>
          <button onClick={() => navigate('/room/create')} className="px-6 py-3 bg-surface-raised border border-border-default hover:border-border-accent rounded-xl font-semibold text-sm transition-colors">
            Create Room
          </button>
        </div>
      </div>
    );
  }

  if (room.connectionState === 'IDLE' || room.connectionState === 'CONNECTING' || room.connectionState === 'AUTHENTICATING' || room.connectionState === 'LOADING_ROOM') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium">Connecting to room...</div>
      </div>
    );
  }

  if (room.connectionState === 'RECONNECTING') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-status-warning border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-status-warning">Connection lost. Reconnecting (Attempt {room.reconnectAttempts})...</div>
      </div>
    );
  }

  if (!room.settings || !game) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium">Synchronizing room lobby...</div>
      </div>
    );
  }

  // Active game states
  if (room.status === 'COUNTDOWN' || room.status === 'PLAYING' || room.status === 'FINISHING' || room.status === 'RESULTS') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        {room.status === 'COUNTDOWN' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-[120px] font-bold font-mono text-white drop-shadow-2xl animate-pulse">
              {room.countdown}
            </div>
          </div>
        )}
        
        {room.status === 'RESULTS' && (
          <MultiplayerResultScreen game={game} />
        )}

        <div className="bg-surface-raised border border-border-default rounded-2xl overflow-hidden shadow-2xl relative min-h-[600px]">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-14 bg-surface-overlay border-b border-border-default z-30 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{game.icon}</span>
              <div className="font-semibold">{game.title}</div>
            </div>
            {room.status === 'RESULTS' && (
              <div className="px-3 py-1 bg-hrsh-accent text-white text-xs font-bold rounded-lg uppercase tracking-wider">Match Finished</div>
            )}
            <button onClick={() => navigate('/multiplayer')} className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-status-danger" title="Leave Match">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>

          <div className="pt-14 h-full">
            {GameComponent && (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin" /></div>}>
                <GameComponent
                  mode={room.settings?.mode}
                  isPaused={false}
                  onGameStart={() => {}}
                  onGameEnd={() => {}}
                  onScoreUpdate={() => {}}
                  onPause={() => {}}
                  onResume={() => {}}
                  multiplayerState={room.gameState}
                  multiplayerRole={me?.isSpectator ? 'spectator' : (room.gameState?.players.indexOf(me?.id) === 0 ? 'player1' : 'player2')}
                  onMultiplayerAction={(action: any) => RoomEngine.sendGameAction(action)}
                  onMatchProgress={(progress: number, liveValue: number) => RoomEngine.sendMatchProgress(progress, liveValue)}
                  onMatchFinished={(progress: number, liveValue: number) => RoomEngine.sendMatchFinished(progress, liveValue)}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    );
  }

  // WAITING STATE
  const activePlayers = room.players.filter(p => !p.isSpectator);
  const spectators = room.players.filter(p => p.isSpectator);

  const renderPlayer = (p: any) => (
    <div key={p.id} className={`p-4 flex items-center justify-between hover:bg-surface-overlay transition-colors ${p.connectionState === 'DISCONNECTED' ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <PlayerCard playerId={p.id} playerName={p.name}>
          <div className="w-10 h-10 rounded-full bg-surface-base border border-border-default flex items-center justify-center font-bold text-lg cursor-pointer transition-hrsh hover-lift">
            {p.name?.[0]?.toUpperCase()}
          </div>
        </PlayerCard>
        <div>
          <div className="font-medium flex items-center gap-2">
            {p.name}
            {p.isHost && <span title="Host">👑</span>}
            {p.id === player?.id && <span className="text-xs text-text-muted">(You)</span>}
          </div>
          {p.connectionState === 'DISCONNECTED' && (
            <div className="text-[10px] text-status-warning font-bold uppercase mt-0.5">Disconnected</div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {p.isReady ? (
          <span className="px-3 py-1 bg-status-success/20 text-status-success text-xs font-bold uppercase rounded-lg">Ready ✓</span>
        ) : (
          <span className="px-3 py-1 bg-surface-base text-text-muted text-xs font-bold uppercase rounded-lg">Waiting</span>
        )}
        
        {isHost && p.id !== player?.id && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                if (window.confirm(`Transfer host to ${p.name}?`)) {
                  RoomEngine.transferHost(p.id);
                }
              }}
              className="text-text-muted hover:text-hrsh-accent text-xs p-1 opacity-50 hover:opacity-100 transition-opacity"
              title="Make Host"
            >
              👑
            </button>
            <button 
              onClick={() => RoomEngine.kickPlayer(p.id)}
              className="text-text-muted hover:text-status-danger text-xs p-1"
              title="Kick Player"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">{game.icon}</span>
            <h1 className="text-2xl font-bold tracking-tight">{room.settings.roomName}</h1>
            {room.settings.visibility === 'private' ? (
              <span className="px-2 py-0.5 bg-surface-base border border-border-default rounded text-[10px] uppercase font-bold text-text-muted">Private</span>
            ) : (
              <span className="px-2 py-0.5 bg-hrsh-accent/20 border border-hrsh-accent/30 text-hrsh-accent rounded text-[10px] uppercase font-bold">Public</span>
            )}
          </div>
          <p className="text-text-muted text-sm flex items-center gap-2">
            <span>{game.title}</span>
            <span>·</span>
            <span className="capitalize">{room.settings.mode} Mode</span>
            <span>·</span>
            <span>{activePlayers.length} / {room.settings.maxPlayers} Players</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 bg-surface-raised border border-border-default hover:border-border-accent rounded-xl transition-colors"
              title="Room Settings"
            >
              ⚙️
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-raised border border-border-default hover:border-border-accent rounded-xl text-sm font-medium transition-colors"
          >
            {copied ? '✅ Copied' : '🔗 Copy Invite'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {showSettings && isHost ? (
            <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Edit Room Settings</h2>
              <RoomSettingsPanel
                mode="edit"
                initialSettings={room.settings}
                playerCount={activePlayers.length}
                onSubmit={(settings) => {
                  RoomEngine.updateSettings(settings);
                  setShowSettings(false);
                }}
                onCancel={() => setShowSettings(false)}
              />
            </div>
          ) : room.teamsEnabled ? (
            <div className="space-y-4">
              {room.teams.map(team => {
                const teamPlayers = activePlayers.filter(p => p.teamId === team.id);
                return (
                  <div key={team.id} className="bg-surface-raised border border-border-default rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border-default flex items-center justify-between" style={{ backgroundColor: `${team.color}15`, borderColor: `${team.color}30` }}>
                      <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: team.color }}>
                        {team.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-surface-base px-2 py-1 rounded border border-border-default">
                          {team.joinCode}
                        </span>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(team.joinCode); }}
                          className="text-xs px-2 py-1 bg-surface-base hover:bg-surface-hover rounded border border-border-default transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-border-default">
                      {teamPlayers.map(renderPlayer)}
                      {teamPlayers.length === 0 && (
                        <div className="p-4 text-sm text-text-muted italic flex items-center justify-center opacity-70">
                          Empty Team
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-raised border border-border-default rounded-2xl overflow-hidden">
              <div className="p-4 bg-surface-overlay border-b border-border-default flex items-center justify-between">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-text-secondary">Players</h2>
              </div>
              
              <div className="divide-y divide-border-default">
                {activePlayers.map(renderPlayer)}
                
                {/* Empty Slots */}
                {Array.from({ length: Math.max(0, (room.settings?.maxPlayers || 2) - activePlayers.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-4 flex items-center gap-3 opacity-50">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-border-default flex items-center justify-center text-text-muted">
                      +
                    </div>
                    <div className="text-sm text-text-muted">Waiting for player...</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player Customization */}
          {!showSettings && game && (
            <PlayerCustomizationPanel 
              gameId={game.id} 
              initialCustomization={me?.customization} 
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="bg-surface-raised border border-border-default rounded-2xl p-6 flex flex-col gap-4">
            {!me?.isSpectator && (
              <button
                onClick={() => RoomEngine.toggleReady()}
                className={`w-full py-4 font-bold rounded-xl text-lg transition-all active:scale-[0.98] ${
                  me?.isReady 
                    ? 'bg-status-success hover:bg-status-success/90 text-white shadow-lg shadow-status-success/20' 
                    : 'bg-surface-base border border-border-default hover:bg-surface-overlay text-text-primary'
                }`}
              >
                {me?.isReady ? 'READY ✓' : 'CLICK TO READY'}
              </button>
            )}

            {isHost && (
              <button
                onClick={() => RoomEngine.startNow()}
                disabled={activePlayers.length < (game.minPlayers || 2)}
                className="w-full py-3 bg-hrsh-accent hover:bg-hrsh-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all"
              >
                Force Start Now
              </button>
            )}

              <button
                onClick={() => navigate('/multiplayer')}
                className="w-full py-3 bg-transparent hover:bg-surface-base text-text-muted hover:text-status-danger font-semibold rounded-xl text-sm transition-colors"
              >
                Leave Room
              </button>
            </div>

            {room.teamsEnabled && !me?.isSpectator && (
              <div className="bg-surface-raised border border-border-default rounded-2xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Join Team</h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = new FormData(e.currentTarget).get('teamCode') as string;
                    if (input && input.trim().length === 4) {
                      RoomEngine.joinTeam(input.trim().toUpperCase());
                    }
                  }}
                  className="flex gap-2"
                >
                  <input 
                    type="text" 
                    name="teamCode" 
                    placeholder="Code" 
                    maxLength={4}
                    className="w-full bg-surface-base border border-border-default rounded-xl px-3 py-2 text-sm text-center font-bold uppercase focus:outline-none focus:border-hrsh-accent placeholder:font-normal placeholder:normal-case"
                  />
                  <button type="submit" className="px-4 py-2 bg-surface-overlay hover:bg-surface-hover border border-border-default rounded-xl font-medium text-sm transition-colors">
                    Join
                  </button>
                </form>
              </div>
            )}

            {/* Spectators */}
          {room.settings.spectatorsAllowed && (
            <div className="bg-surface-raised border border-border-default rounded-2xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center justify-between">
                <span>Spectators</span>
                <span className="bg-surface-base px-2 py-0.5 rounded-full">{spectators.length}</span>
              </h3>
              
              {spectators.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {spectators.map(s => (
                    <div key={s.id} className="text-xs px-2.5 py-1.5 bg-surface-base border border-border-default rounded-lg flex items-center gap-2">
                      👀 {s.name} {s.id === player?.id && '(You)'}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-text-muted italic">No spectators yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
