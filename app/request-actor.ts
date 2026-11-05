import {env} from 'cloudflare:workers';
import {supabaseActor} from './supabase-identity.mjs';

export async function registeredActor(request: Request): Promise<any> {
  if (request.headers.has('authorization')) return supabaseActor(request, env.DB!);
  const identity = request.headers.get('oai-authenticated-user-id');
  if (!identity) return null;
  return env.DB!.prepare('SELECT * FROM users WHERE identity=? AND active=1').bind(identity).first();
}

export async function registeredOwner(request: Request): Promise<any> {
  const actor = await registeredActor(request);
  return actor?.role === 'owner' ? actor : null;
}
