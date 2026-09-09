import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomSettingsPanel } from '../../components/multiplayer/RoomSettingsPanel';
import { usePlayerStore } from '../../stores/playerStore';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { player } = usePlayerStore();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const URL_BASE = import.meta.env.PROD 
    ? window.location.origin
    : 'http://localhost:8787';

  const handleCreate = async (settings: any) => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`${URL_BASE}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (!data.success || !data.roomId || typeof data.roomId !== 'string' || !data.roomCode) {
        console.error('[CreateRoom] Malformed response:', data);
        throw new Error(data.error || 'Invalid room response from server: Missing room details.');
      }

      const roomId = data.roomId.toUpperCase();
      
      // Cache settings in sessionStorage as a fallback during connection handshake
      try {
        sessionStorage.setItem(`hrsh_initial_settings_${roomId}`, JSON.stringify(settings));
      } catch (e) {
        // Storage unavailable / private mode fallback
      }
      
      navigate(`/room/${roomId}`);
    } catch (err: any) {
      console.error('[CreateRoom] Room creation failed:', err);
      setError(err?.message || 'Could not connect to multiplayer server. Please check your connection and try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold tracking-tight">Create Room</h1>
        <p className="text-text-muted text-sm mt-1">Set up a custom match</p>
      </div>

      <div className="bg-surface-raised border border-border-default rounded-2xl p-6 shadow-xl">
        {error && (
          <div className="mb-6 p-4 bg-status-danger/10 border border-status-danger/20 rounded-xl text-sm text-status-danger flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <span>⚠️</span>
              <span>Room Creation Failed</span>
            </div>
            <p className="text-xs">{error}</p>
          </div>
        )}
        
        {isCreating ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-sm font-medium">Provisioning game server...</div>
            <div className="text-xs text-text-muted mt-1">Setting up room lobby and rules</div>
          </div>
        ) : (
          <RoomSettingsPanel 
            mode="create" 
            initialSettings={{ roomName: `${player?.name || 'Player'}'s Room` }}
            onSubmit={handleCreate} 
          />
        )}
      </div>
    </div>
  );
}

