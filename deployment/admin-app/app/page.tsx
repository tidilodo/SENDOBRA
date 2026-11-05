import {redirect} from 'next/navigation';
import {currentSession} from '../lib/current-session';
import Dashboard from './Dashboard';
export const dynamic='force-dynamic';
export default async function Page(){if(!await currentSession())redirect('/entrar');return <Dashboard/>;}
