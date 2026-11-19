'use client';

import {useState} from 'react';
import PasswordField from '../entrar/PasswordField';

export default function RecoveryForm({code}:{code:string}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setError('');
    const fields=new FormData(event.currentTarget);
    const password=fields.get('password');
    try{
      if(code&&password!==fields.get('confirmation'))throw Error('As senhas precisam ser iguais.');
      const response=await fetch('/api/auth/recovery',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(code?{action:'update',code,password}:{action:'request',email:fields.get('email')}),
      });
      const result=await response.json();
      if(!response.ok)throw Error(result.error);
      setDone(true);
    }catch(error){
      setError(error instanceof Error?error.message:'Não foi possível concluir.');
    }finally{setBusy(false);}
  }

  return <main className="admin-login"><section className="panel">
    <h1>{code?'Criar nova senha':'Recuperar senha'}</h1>
    {done?<p role="status">{code?'Senha atualizada. Entre com a nova senha.':'Se o e-mail estiver cadastrado, você receberá um link. Abra-o neste mesmo navegador.'}</p>:
      <form onSubmit={submit}>
        {code?<><PasswordField label="Nova senha" autoComplete="new-password" minLength={8}/><PasswordField label="Confirmar nova senha" name="confirmation" autoComplete="new-password" minLength={8}/></>:
          <label>E-mail<input type="email" name="email" required maxLength={254} autoComplete="email"/></label>}
        {error&&<p role="alert" className="alert error">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>{busy?'Aguarde…':code?'Salvar nova senha':'Enviar link'}</button>
      </form>}
    {code&&!done&&<p><a href="/recuperar-senha">Solicitar outro link</a></p>}
    <a href="/entrar">Voltar para o login</a>
  </section></main>;
}
