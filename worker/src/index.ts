export interface Env {
  ROOM: DurableObjectNamespace;
  LIVE_INDEX: DurableObjectNamespace;
  ASSETS: Fetcher;
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
      // Just returning a new room ID to the client
      const newRoomId = generateRoomId();
      return new Response(JSON.stringify({ roomId: newRoomId }), {
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
