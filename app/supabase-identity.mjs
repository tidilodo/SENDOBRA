export const supabaseAuthUrl = 'https://kciwsyoebypthsnzraup.supabase.co/auth/v1';
export const supabasePublishableKey = 'sb_publishable_RKQ_TNR6oAkUf4OMHvmVWw_DKCHZpPm';

export async function verifySupabaseUser(token, fetchImpl = fetch) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 8192 || /\s/.test(token)) return null;
  const response = await fetchImpl(supabaseAuthUrl + '/user', {
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
    headers: { apikey: supabasePublishableKey, Authorization: 'Bearer ' + token }
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!/^[a-f0-9-]{36}$/i.test(user.id || '') || !user.email_confirmed_at || typeof user.email !== 'string') return null;
  return { subject: user.id, email: user.email.trim().toLowerCase() };
}

export async function supabaseActor(request, db, fetchImpl = fetch) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const identity = await verifySupabaseUser(authorization.slice(7), fetchImpl);
  if (!identity) return null;

  let user = await db.prepare('SELECT u.* FROM users u JOIN supabase_user_bindings b ON b.user_id=u.id WHERE b.subject=? AND u.active=1 AND lower(u.email)=?')
    .bind(identity.subject, identity.email).first();
  if (user) return user;

  // Bind only a confirmed account to an already active, pre-registered user.
  // Both subject and user_id are unique, so recreation of an Auth account cannot replace a binding.
  const candidate = await db.prepare('SELECT * FROM users WHERE lower(email)=? AND active=1').bind(identity.email).first();
  if (!candidate) return null;
  const existing = await db.prepare('SELECT subject FROM supabase_user_bindings WHERE user_id=? OR subject=?').bind(candidate.id, identity.subject).first();
  if (existing) return null;
  const now = new Date().toISOString();
  try {
    await db.batch([
      db.prepare('INSERT INTO supabase_user_bindings VALUES(?,?,?)').bind(identity.subject, candidate.id, now),
      db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(), candidate.id, 'user.supabase.bind', candidate.id, null, JSON.stringify({ subject: identity.subject }), now)
    ]);
  } catch {
    // Another request may have completed the same first login.
  }
  return db.prepare('SELECT u.* FROM users u JOIN supabase_user_bindings b ON b.user_id=u.id WHERE b.subject=? AND u.active=1 AND lower(u.email)=?')
    .bind(identity.subject, identity.email).first();
}
