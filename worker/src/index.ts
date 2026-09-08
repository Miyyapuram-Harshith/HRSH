export interface Env {
  ROOM: DurableObjectNamespace;
  LIVE_INDEX: DurableObjectNamespace;
  ASSETS: Fetcher;
  DB: D1Database;
}

export { RoomDurableObject } from './RoomDurableObject';
export { LiveIndexDurableObject } from './LiveIndexDurableObject';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Live Activity Polling Endpoint
    if (url.pathname === '/api/live') {
      const liveIndexId = env.LIVE_INDEX.idFromName('GLOBAL_INDEX');
      const liveIndex = env.LIVE_INDEX.get(liveIndexId);
      return liveIndex.fetch(request);
    }
    
    // Player API endpoints
    if (url.pathname.startsWith('/api/player/sync') && request.method === 'POST') {
      try {
        const payload: any = await request.json();
        if (env.DB) {
          const { Database } = await import('./db');
          const db = new Database(env.DB);
          await db.createOrUpdatePlayer(payload.id, payload.name || 'Player');
          const dbPlayer = await db.getPlayer(payload.id);
          return new Response(JSON.stringify(dbPlayer), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      } catch (e) {
        return new Response('Error syncing player', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }
    
    if (url.pathname.startsWith('/api/player/')) {
      const segments = url.pathname.split('/');
      const playerId = segments[3];
      if (playerId && env.DB && request.method === 'GET') {
        const { Database } = await import('./db');
        const db = new Database(env.DB);
        const player = await db.getPlayer(playerId);
        if (player) {
          return new Response(JSON.stringify(player), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        return new Response('Not Found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    // Room WebSocket endpoints
    if (url.pathname.startsWith('/api/room/')) {
      const segments = url.pathname.split('/');
      if (segments.length < 4) {
        return new Response('Bad Request', { status: 400 });
      }
      const roomId = segments[3];
      
      // Upgrade request is handled by the Durable Object
      const doId = env.ROOM.idFromName(roomId);
      const roomDO = env.ROOM.get(doId);
      return roomDO.fetch(request);
    }

    // Creating a room (generates a unique ID)
    if (url.pathname === '/api/create-room' && request.method === 'POST') {
      const newRoomId = generateRoomId();
      let settings = {};
      try {
        settings = await request.json();
      } catch (e) {
        // ignore
      }
      
      // Explicitly initialize the Durable Object so it marks itself as created
      const doId = env.ROOM.idFromName(newRoomId);
      const roomDO = env.ROOM.get(doId);
      
      const initUrl = new URL(request.url);
      initUrl.pathname = `/api/init/${newRoomId}`;
      const initRes = await roomDO.fetch(new Request(initUrl.toString(), { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      }));
      
      if (!initRes.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to init room' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      
      const doState = await initRes.json() as any;

      return new Response(JSON.stringify({ 
        success: true, 
        roomId: newRoomId,
        roomCode: doState.roomCode,
        roomUrl: `/room/${newRoomId}`,
        gameId: doState.gameId,
        mode: doState.mode,
        settings: doState.settings,
        gameSettings: doState.gameSettings,
        createdAt: doState.createdAt
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Serve static assets for all other routes
    if (request.method === 'GET' || request.method === 'HEAD') {
      try {
        let response = await env.ASSETS.fetch(request);
        
        // SPA Fallback: if asset not found, serve index.html
        if (response.status === 404) {
          const indexUrl = new URL(request.url);
          indexUrl.pathname = '/index.html';
          response = await env.ASSETS.fetch(new Request(indexUrl, request));
        }
        
        return response;
      } catch (err) {
        return new Response('Internal Error fetching assets', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
