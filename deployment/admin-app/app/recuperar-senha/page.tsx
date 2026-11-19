import type {Metadata} from 'next';
import RecoveryForm from './RecoveryForm';

export const metadata:Metadata={title:'Recuperar senha | ZapiObra',referrer:'no-referrer'};

export default async function Page({searchParams}:{searchParams:Promise<{code?:string}>}){
  const {code}=await searchParams;
  return <RecoveryForm code={typeof code==='string'?code:''}/>;
}
