import { Env } from './index';

export class LiveIndexDurableObject {
  private state: DurableObjectState;
  private env: Env;
  private activeRooms: Map<string, any> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // In a real implementation, state might be loaded from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<Map<string, any>>('rooms');
      if (stored) {
        this.activeRooms = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/live/update') {
      // Internal call from Room DOs to update their status
      try {
        const body = await request.json() as any;
        if (body.action === 'remove') {
          this.activeRooms.delete(body.roomId);
        } else {
          this.activeRooms.set(body.roomId, body.roomData);
        }
        await this.state.storage.put('rooms', this.activeRooms);
        return new Response('OK', { status: 200 });
      } catch (e) {
        return new Response('Bad Request', { status: 400 });
      }
    }

    if (request.method === 'GET') {
      // Client requesting live rooms
      const roomsList = Array.from(this.activeRooms.values());
      return new Response(JSON.stringify(roomsList), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  }
}
