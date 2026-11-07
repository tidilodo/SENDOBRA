'use client';
import {useEffect,useRef,useState} from 'react';
import {MapPin,LocateFixed} from 'lucide-react';
import {suggestProjects} from '../lib/project-geo.mjs';
type Project={id:string,name:string,status:string};
type Location={project:string,latitude:number,longitude:number,radius:number,enabled:boolean,version:string};
function position():Promise<GeolocationPosition>{
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(Error('Este navegador não oferece localização. Escolha a obra manualmente.'));return;}
    navigator.geolocation.getCurrentPosition(resolve,error=>reject(Error(error.code===1?'Localização não autorizada. Você pode escolher a obra manualmente.':error.code===3?'A localização demorou demais. Tente novamente ou escolha a obra.':'Não foi possível localizar você. Escolha a obra manualmente.')),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  });
}
export default function ProjectLocation({projects,owner,selected,onSelect}:{projects:Project[],owner:boolean,selected:string,onSelect:(id:string)=>void}){
  const [locations,setLocations]=useState<Location[]>([]),[loading,setLoading]=useState(true),[locating,setLocating]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<any>(null);
  const [editing,setEditing]=useState(''),[latitude,setLatitude]=useState(''),[longitude,setLongitude]=useState(''),[radius,setRadius]=useState('150'),[enabled,setEnabled]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  const mounted=useRef(true),requestId=useRef(0);
  useEffect(()=>{mounted.current=true;load();return()=>{mounted.current=false;requestId.current++;};},[]);
  async function load(){setLoading(true);try{const r=await fetch('/api/project-locations',{cache:'no-store'}),body=await r.json();if(!r.ok)throw Error(body.error);if(mounted.current){setLocations(body.locations);setError('');setResult(null);return body.locations as Location[];}}catch(e:any){if(mounted.current)setError(e.message||'Localização indisponível. Selecione a obra manualmente.');}finally{if(mounted.current)setLoading(false);}return null;}
  async function locate(forSetup=false){
    const id=++requestId.current;setLocating(true);setError('');setMessage('');setResult(null);
    try{const p=await position();if(!mounted.current||id!==requestId.current)return;
      if(Date.now()-p.timestamp>60000)throw Error('Localização desatualizada. Tente novamente.');
      const coords={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy};
      if(forSetup){if(coords.accuracy>100)throw Error('Precisão insuficiente para cadastrar o ponto. Tente ao ar livre ou informe as coordenadas manualmente.');setLatitude(coords.latitude.toFixed(7));setLongitude(coords.longitude.toFixed(7));setMessage('Ponto preenchido. Confira a obra e salve para confirmar.');}
      else{setResult({...suggestProjects(coords,locations.filter(l=>projects.some(p=>p.id===l.project&&p.status==='active'))),accuracy:Math.round(coords.accuracy)});}
    }catch(e:any){if(mounted.current&&id===requestId.current)setError(e.message);}finally{if(mounted.current&&id===requestId.current)setLocating(false);}
  }
  function edit(id:string){requestId.current++;setLocating(false);setEditing(id);const saved=locations.find(l=>l.project===id);setLatitude(saved?String(saved.latitude):'');setLongitude(saved?String(saved.longitude):'');setRadius(saved?String(saved.radius):'150');setEnabled(saved?.enabled??true);setMessage('');setError('');setResult(null);}
  async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError('');setMessage('');
    try{const toNumber=(s:string)=>Number(s.trim().replace(',','.'));if(!latitude.trim()||!longitude.trim())throw Error('Informe latitude e longitude.');
      const r=await fetch('/api/project-locations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:editing,latitude:toNumber(latitude),longitude:toNumber(longitude),radius:toNumber(radius),enabled,version:locations.find(l=>l.project===editing)?.version||null})}),body=await r.json();if(!r.ok)throw Error(body.error);
      if(await load())setMessage('Local da obra salvo. A equipe já pode usar a identificação por proximidade.');
    }catch(e:any){setError(e.message);}finally{setSaving(false);}
  }
  const active=projects.filter(p=>p.status==='active');
  return <section className="panel geo-panel" aria-label="Identificação da obra">
    <div className="geo-heading"><div><h2><MapPin size={18}/>Obra selecionada</h2><p>Escolha a obra ou use sua localização para receber uma sugestão.</p></div><button type="button" disabled={loading||locating||!locations.some(l=>l.enabled&&active.some(p=>p.id===l.project))} onClick={()=>locate()}><LocateFixed size={18}/>{locating?'Localizando…':'Identificar minha obra'}</button></div>
    <label className="geo-select">Obra<select value={selected} onChange={e=>{requestId.current++;setLocating(false);onSelect(e.target.value);setResult(null);}}><option value="">Escolha uma obra</option>{active.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    {!loading&&!locations.some(l=>l.enabled)&&<p className="geo-help">{owner?'Cadastre abaixo o ponto de referência das obras para ativar a sugestão.':'O responsável ainda não cadastrou os pontos das obras. Use a seleção manual.'}</p>}
    <p className="geo-help">A localização é consultada somente ao tocar no botão. Ela não é enviada nem armazenada para identificar sua obra.</p>
    {error&&<p className="alert error" role="alert">{error}</p>}{message&&<p className="alert success" role="status">{message}</p>}
    {result&&<div className="geo-results" role="status">
      <p>{result.state==='outside'?'Nenhuma obra cadastrada foi encontrada perto de você. Escolha a obra manualmente.':result.state==='suggested'?'Encontramos uma obra próxima. Confirme antes de continuar.':result.state==='ambiguous'?'Há mais de uma obra possível. Escolha a correta.':'A precisão é baixa para identificar a obra com segurança. Confira a sugestão ou escolha manualmente.'}</p>
      <small>Precisão informada pelo aparelho: aproximadamente {result.accuracy} m.</small>
      {result.candidates.filter((l:any)=>active.some(p=>p.id===l.project)).map((l:any)=><div className="geo-candidate" key={l.project}><div><b>{active.find(p=>p.id===l.project)?.name}</b><small>Aproximadamente {l.distance} m do ponto cadastrado</small></div><button type="button" onClick={()=>{onSelect(l.project);setResult(null);}}>Confirmar esta obra</button></div>)}
    </div>}
    {owner&&<details className="geo-settings"><summary>Configurar localização das obras</summary>
      <p>Estando na obra, use o local atual ou informe as coordenadas do ponto de referência. O raio inicial sugerido é 150 metros.</p>
      <label>Obra a configurar<select value={editing} disabled={saving||loading} onChange={e=>edit(e.target.value)}><option value="">Selecione uma obra</option>{active.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {editing&&<form onSubmit={save}><button type="button" disabled={saving||locating} onClick={()=>locate(true)}>Usar meu local atual como referência</button>
        <div className="geo-fields"><label>Latitude<input required inputMode="decimal" value={latitude} disabled={saving} onChange={e=>setLatitude(e.target.value)} placeholder="-16.6800000"/></label><label>Longitude<input required inputMode="decimal" value={longitude} disabled={saving} onChange={e=>setLongitude(e.target.value)} placeholder="-49.2500000"/></label><label>Raio em metros<input required type="number" min="20" max="2000" step="1" inputMode="numeric" value={radius} disabled={saving} onChange={e=>setRadius(e.target.value)}/></label></div>
        <label className="geo-check"><input type="checkbox" checked={enabled} disabled={saving} onChange={e=>setEnabled(e.target.checked)}/>Ativar sugestão para esta obra</label><button className="primary" disabled={saving||loading||locating}>{saving?'Salvando…':'Salvar local da obra'}</button>
      </form>}
    </details>}
  </section>;
}
