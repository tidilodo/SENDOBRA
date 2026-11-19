'use client';

import {useEffect,useRef,useState} from 'react';

export default function MobileExpense({projects,onSaved}:{projects:{id:string;name:string;status:string}[];onSaved:()=>Promise<void>}) {
  const active=projects.filter(project=>project.status==='active');
  const [project,setProject]=useState(active.length===1?active[0].id:'');
  const [date,setDate]=useState(()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date()));
  const [amount,setAmount]=useState('');
  const [description,setDescription]=useState('');
  const [file,setFile]=useState<File>();
  const [preview,setPreview]=useState('');
  useEffect(()=>{
    if(!file?.type.startsWith('image/')){setPreview('');return;}
    const url=URL.createObjectURL(file);
    setPreview(url);
    return ()=>URL.revokeObjectURL(url);
  },[file]);
  const [saved,setSaved]=useState<{id:string;status:string}>();
  const [complete,setComplete]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const request=useRef<{id:string;body:string}|null>(null);
  const inFlight=useRef(false);

  async function post(body:FormData|string){
    const response=await fetch('/api/data',{method:'POST',body,headers:typeof body==='string'?{'Content-Type':'application/json'}:undefined});
    const result=await response.json();
    if(!response.ok)throw Error(result.error||'Falha no envio.');
    return result;
  }

  async function submit(event:React.FormEvent){
    event.preventDefault();
    if(inFlight.current||complete)return;
    inFlight.current=true;
    setBusy(true);
    setError('');
    try{
      let record=saved;
      if(!record){
        const fields={action:'record',type:'expense',project,date,amount,description};
        const body=JSON.stringify(fields);
        if(request.current?.body!==body)request.current={body,id:crypto.randomUUID()};
        const result=await post(JSON.stringify({...fields,request_id:request.current.id}));
        if(typeof result.id!=='string'||typeof result.status!=='string')throw Error('O servidor ainda não confirmou o envio.');
        record={id:result.id,status:result.status};
        setSaved(record);
      }
      if(file){
        const data=new FormData();
        data.set('record',record.id);
        data.set('file',file);
        await post(data);
      }
      setComplete(true);
      void onSaved().catch(()=>{});
    }catch(error){
      setError(error instanceof Error?error.message:'Não foi possível concluir o envio.');
    }finally{
      inFlight.current=false;
      setBusy(false);
    }
  }

  return <section className="panel mobile-expense" aria-labelledby="mobile-expense-heading">
    <h2 id="mobile-expense-heading">Registrar despesa</h2>
    <form onSubmit={submit}>
      <fieldset disabled={busy||!!saved}>
        <label>Obra<select required value={project} onChange={event=>setProject(event.target.value)}>
          <option value="">Selecione a obra</option>
          {active.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>Valor em reais<input required inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)}/></label>
        <label>Descrição<input required maxLength={300} value={description} onChange={event=>setDescription(event.target.value)}/></label>
        <label>Data<input required type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>
      </fieldset>
      {!complete&&<>
        <div className="mobile-expense-files">
          <label>Fotografar nota<input type="file" accept="image/*" capture="environment" disabled={busy} onChange={event=>selectFile(event.target.files?.[0])}/></label>
          <label>Escolher arquivo<input type="file" accept="image/jpeg,image/png,application/pdf" disabled={busy} onChange={event=>selectFile(event.target.files?.[0])}/></label>
        </div>
        {preview&&<img src={preview} alt="Prévia da nota" width={88}/>}
        {file&&<p>{file.name} <button type="button" disabled={busy} onClick={()=>setFile(undefined)}>Remover</button></p>}
      </>}
      {saved&&<p role="status">Despesa registrada em {active.find(item=>item.id===project)?.name} · {saved.status==='pending_approval'?'Em conferência':saved.status==='approved'?'Aprovada':saved.status==='rejected'?'Rejeitada':'Registrada'}{!complete&&file?' · Anexo pendente':''}</p>}
      {error&&<p role="alert">{error}</p>}
      {!complete&&<button type="submit" className="primary" disabled={busy}>{busy?'Enviando…':saved?'Concluir envio':'Enviar despesa'}</button>}
      {complete&&<button type="button" onClick={()=>{request.current=null;setSaved(undefined);setComplete(false);setFile(undefined);setAmount('');setDescription('');}}>Registrar outra despesa</button>}
    </form>
  </section>;

  function selectFile(next?:File){
    if(!next)return;
    if(!['image/jpeg','image/png','application/pdf'].includes(next.type)||next.size===0||next.size>4000000){
      setError('Escolha uma imagem JPEG ou PNG, ou um PDF de até 4 MB.');
      return;
    }
    setError('');
    setFile(next);
  }
}
