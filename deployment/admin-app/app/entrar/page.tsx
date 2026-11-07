'use client';
import {useState} from 'react';
export default function Login(){
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');
    const fields=new FormData(event.currentTarget);
    try{
      const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fields.get('email'),password:fields.get('password')})});
      const value=await response.json();if(!response.ok)throw Error(value.error);location.assign('/');
    }catch(e:any){setError(e.message||'Não foi possível entrar.');}finally{setBusy(false);}
  }
  return <main className="admin-login"><section className="panel"><h1>ZAPIOBRA</h1><h2>Acessar a administração</h2><p>Entre para acompanhar suas obras.</p><form onSubmit={submit}><label>E-mail<input type="email" name="email" autoComplete="username" required/></label><label>Senha<input type="password" name="password" autoComplete="current-password" required maxLength={1024}/></label>{error&&<p role="alert" className="alert error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Entrando…':'Entrar'}</button></form><a href="https://demo.sendobra.zroprojects.com.br/">Abrir demonstração</a></section></main>;
}
