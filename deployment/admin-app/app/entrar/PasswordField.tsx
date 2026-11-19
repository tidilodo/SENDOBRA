'use client';

import {useState} from 'react';
import {Eye,EyeOff} from 'lucide-react';

export default function PasswordField({label='Senha',name='password',autoComplete='current-password',minLength}:{
  label?:string;
  name?:string;
  autoComplete?:string;
  minLength?:number;
}){
  const [visible,setVisible]=useState(false);
  const Icon=visible?EyeOff:Eye;
  return <div className="password-field">
    <label htmlFor={name}>{label}</label>
    <div className="password-control">
      <input id={name} name={name} type={visible?'text':'password'} autoComplete={autoComplete} required minLength={minLength} maxLength={1024}/>
      <button type="button" aria-label={visible?'Ocultar '+label.toLowerCase():'Mostrar '+label.toLowerCase()} onClick={()=>setVisible(!visible)}>
        <Icon size={20} aria-hidden="true"/>
      </button>
    </div>
  </div>;
}
