import {createHash} from 'node:crypto';
export async function transcribeAudio(bytes, {url, apiKey, id, fetchImpl=fetch, pollMs=1000, timeoutMs=120000}) {
 const base=new URL(url);
 if(base.protocol!=='https:' && !(base.protocol==='http:' && ['127.0.0.1','localhost','[::1]'].includes(base.hostname))) throw Error('Audio Engine exige HTTPS ou loopback');
 if(!apiKey || !bytes?.length || bytes.length>10*1024*1024) throw Error('Configuração ou tamanho de áudio inválido');
 const signal=AbortSignal.timeout(timeoutMs), headers={Authorization:'Bearer '+apiKey};
 const form=new FormData();form.set('audio_file',new Blob([bytes],{type:'audio/ogg'}),'whatsapp.ogg');form.set('language','pt');
 const created=await fetchImpl(new URL('/api/v1/jobs',base),{method:'POST',headers:{...headers,'Idempotency-Key':createHash('sha256').update('sendobra:'+id).digest('hex')},body:form,redirect:'error',signal});
 if(!created.ok) throw Error('Audio Engine rejeitou upload: '+created.status);
 const job=await created.json();if(typeof job.job_id!=='string'||!/^job_[a-zA-Z0-9_-]+$/.test(job.job_id)) throw Error('Job inválido');
 while(!signal.aborted) {
  const response=await fetchImpl(new URL('/api/v1/jobs/'+encodeURIComponent(job.job_id),base),{headers,redirect:'error',signal});
  if(!response.ok)throw Error('Audio Engine indisponível: '+response.status);
  const current=await response.json();
  if(current.status==='completed') {const text=current.result?.text;if(typeof text!=='string'||!text.trim()||text.length>4000)throw Error('Transcrição vazia ou longa demais');return text.trim();}
  if(['failed','cancelled'].includes(current.status))throw Error('Transcrição não concluída');
  if(!['queued','processing'].includes(current.status))throw Error('Estado de transcrição inválido');
  await new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(Error('Tempo de transcrição excedido'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},pollMs);signal.addEventListener('abort',abort,{once:true});});
 }
 throw Error('Tempo de transcrição excedido');
}
export async function audioEvent(event,message,{download,allowedSenders,engine}) {
 if(event.kind!=='audio'||!allowedSenders.has(event.sender))return event;
 const audio=(message.message?.ephemeralMessage?.message||message.message)?.audioMessage;
 if(!audio||!String(audio.mimetype||'').startsWith('audio/ogg')||Number(audio.seconds)>120||Number(audio.fileLength)>10*1024*1024)throw Error('Áudio fora dos limites do piloto');
 const chunks=[];let size=0;
 for await(const chunk of await download(audio)) {size+=chunk.length;if(size>10*1024*1024)throw Error('Áudio excede limite');chunks.push(chunk);}
 const text=await transcribeAudio(Buffer.concat(chunks),{...engine,id:event.group+':'+event.id});
 return {...event,text};
}
