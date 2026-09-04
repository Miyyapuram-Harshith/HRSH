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
      });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      
      // Navigate to the lobby where settings will be applied by host
      // Since it's a new room, we will just navigate there and the room DO will init
      // We will pass the initial settings in state so the lobby can apply them immediately
      navigate(`/room/${data.roomId}`, { state: { initialSettings: settings } });
    } catch (err) {
      console.error(err);
      setError('Could not connect to multiplayer server.');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold tracking-tight">Create Room</h1>
        <p className="text-text-muted text-sm mt-1">Set up a custom match</p>
      </div>

      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        {error && (
          <div className="mb-6 p-4 bg-status-danger/10 border border-status-danger/20 rounded-xl text-sm text-status-danger">
            {error}
          </div>
        )}
        
        {isCreating ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-sm font-medium">Provisioning server...</div>
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
