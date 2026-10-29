import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {readSession} from '../lib/session.mjs';
import Dashboard from './Dashboard';
export const dynamic='force-dynamic';
export default async function Page(){const h=await headers();if(!readSession(h.get('cookie')))redirect('/acesso');return <Dashboard/>;}
