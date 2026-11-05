import {cookies} from 'next/headers';
import {COOKIE,openSession,confirmedUser} from './session.mjs';
export async function currentSession(){
  const jar=await cookies();
  const session=openSession(jar.get(COOKIE)?.value,process.env.ADMIN_SESSION_KEY);
  if(!session)return null;
  try {
    const user=await confirmedUser(session.token);
    return user?{...session,user}:null;
  } catch {return null;}
}
