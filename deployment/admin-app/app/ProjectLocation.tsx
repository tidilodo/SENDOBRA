'use client';
import {useEffect,useRef,useState} from 'react';
import {MapPin,LocateFixed} from 'lucide-react';
import ProjectLocationMap from './ProjectLocationMap';
import {lookupPostcode,addressLabel} from '../lib/project-address.mjs';
import {suggestProjects} from '../lib/project-geo.mjs';
type Project={id:string,name:string,status:string,address?:string};
type Address={cep:string,street:string,number:string,complement:string,district:string,city:string,state:string};
const blankAddress=():Address=>({cep:'',street:'',number:'',complement:'',district:'',city:'',state:''});
type Location={project:string,latitude:number,longitude:number,radius:number,enabled:boolean,version:string,address?:Address,point_source?:string};
function position():Promise<GeolocationPosition>{
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(Error('Este navegador não oferece localização. Escolha a obra manualmente.'));return;}
    navigator.geolocation.getCurrentPosition(resolve,error=>reject(Error(error.code===1?'Localização não autorizada. Você pode escolher a obra manualmente.':error.code===3?'A localização demorou demais. Tente novamente ou escolha a obra.':'Não foi possível localizar você. Escolha a obra manualmente.')),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  });
}
export default function ProjectLocation({projects,owner,selected,onSelect}:{projects:Project[],owner:boolean,selected:string,onSelect:(id:string)=>void}){
  const [locations,setLocations]=useState<Location[]>([]),[loading,setLoading]=useState(true),[locating,setLocating]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<any>(null);
  const [editing,setEditing]=useState(''),[latitude,setLatitude]=useState(''),[longitude,setLongitude]=useState(''),[radius,setRadius]=useState('150'),[enabled,setEnabled]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  const [address,setAddress]=useState<Address>(blankAddress),[postcodeBusy,setPostcodeBusy]=useState(false),[pointSource,setPointSource]=useState('manual'),[pointConfirmed,setPointConfirmed]=useState(false);
  const mounted=useRef(true),requestId=useRef(0);
  useEffect(()=>{mounted.current=true;load();return()=>{mounted.current=false;requestId.current++;};},[]);
  async function load(){setLoading(true);try{const r=await fetch('/api/project-locations',{cache:'no-store'}),body=await r.json();if(!r.ok)throw Error(body.error);if(mounted.current){setLocations(body.locations);setError('');setResult(null);return body.locations as Location[];}}catch(e:any){if(mounted.current)setError(e.message||'Localização indisponível. Selecione a obra manualmente.');}finally{if(mounted.current)setLoading(false);}return null;}
  async function locate(forSetup=false){
    const id=++requestId.current;setLocating(true);setError('');setMessage('');setResult(null);
    try{const p=await position();if(!mounted.current||id!==requestId.current)return;
      if(Date.now()-p.timestamp>60000)throw Error('Localização desatualizada. Tente novamente.');
      const coords={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy};
      if(forSetup){if(coords.accuracy>100)throw Error('Precisão insuficiente para cadastrar o ponto. Tente ao ar livre ou informe as coordenadas manualmente.');setLatitude(coords.latitude.toFixed(7));setLongitude(coords.longitude.toFixed(7));setPointSource('gps');setPointConfirmed(false);setMessage('Ponto preenchido. Confira a obra e salve para confirmar.');}
      else{setResult({...suggestProjects(coords,locations.filter(l=>projects.some(p=>p.id===l.project&&p.status==='active'))),accuracy:Math.round(coords.accuracy)});}
    }catch(e:any){if(mounted.current&&id===requestId.current)setError(e.message);}finally{if(mounted.current&&id===requestId.current)setLocating(false);}
  }
  function changeAddress(field:keyof Address,value:string){setAddress(a=>({...a,[field]:value}));setPointConfirmed(false);setMessage('');}
  async function findPostcode(){const id=++requestId.current;setPostcodeBusy(true);setError('');setMessage('');
    try{const found=await lookupPostcode(address.cep);if(!mounted.current||id!==requestId.current)return;setAddress(a=>({...blankAddress(),...found.address,number:a.number,complement:a.complement}));setPointConfirmed(false);
      if(found.approximate){setLatitude(String(found.approximate.latitude));setLongitude(String(found.approximate.longitude));setPointSource('postcode');setMessage('Endereço preenchido. O ponto do CEP é aproximado: ajuste no mapa até a obra e confirme.');}
      else{setLatitude('');setLongitude('');setPointSource('manual');setMessage('Endereço preenchido, mas sem ponto disponível. Abra o endereço no mapa externo e informe as coordenadas em Opções avançadas, ou use o GPS na obra.');}
    }catch(e:any){if(mounted.current&&id===requestId.current)setError(e.message);}finally{if(mounted.current&&id===requestId.current)setPostcodeBusy(false);}
  }
  function edit(id:string){requestId.current++;setLocating(false);setEditing(id);const saved=locations.find(l=>l.project===id);setLatitude(saved?String(saved.latitude):'');setLongitude(saved?String(saved.longitude):'');setRadius(saved?String(saved.radius):'150');setEnabled(saved?.enabled??true);setAddress(saved?.address||{...blankAddress(),street:(projects.find(p=>p.id===id)?.address||'').slice(0,180)});setPointSource(saved?.point_source||'manual');setPointConfirmed(false);setMessage('');setError('');setResult(null);}
  async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError('');setMessage('');
    try{const toNumber=(s:string)=>Number(s.trim().replace(',','.'));if(!latitude.trim()||!longitude.trim())throw Error('Defina o ponto da obra pelo mapa, GPS ou coordenadas.');if(!pointConfirmed)throw Error('Confirme que o ponto marcado corresponde à obra.');
      const r=await fetch('/api/project-locations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:editing,latitude:toNumber(latitude),longitude:toNumber(longitude),radius:toNumber(radius),enabled,version:locations.find(l=>l.project===editing)?.version||null,address,point_source:pointSource,confirm_point:pointConfirmed})}),body=await r.json();if(!r.ok)throw Error(body.error);
      if(await load())setMessage('Local da obra salvo. A equipe já pode usar a identificação por proximidade.');
    }catch(e:any){setError(e.message);}finally{setSaving(false);}
  }
  const numericLatitude=latitude.trim()?Number(latitude.replace(',','.')):NaN,numericLongitude=longitude.trim()?Number(longitude.replace(',','.')):NaN;
  const hasPoint=Number.isFinite(numericLatitude)&&Math.abs(numericLatitude)<=90&&Number.isFinite(numericLongitude)&&Math.abs(numericLongitude)<=180;
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

      <p>Cadastre por CEP e endereço, confira o ponto no mapa e salve. Você também pode usar o GPS estando na obra.</p>
      <label>Obra a configurar<select value={editing} disabled={saving||loading||postcodeBusy} onChange={e=>edit(e.target.value)}><option value="">Selecione uma obra</option>{active.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {editing&&<form onSubmit={save}>
        <div className="geo-cep"><label>CEP<input inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" value={address.cep} disabled={saving||postcodeBusy} onChange={e=>changeAddress('cep',e.target.value.replace(/[^0-9-]/g,''))}/></label><button type="button" disabled={saving||postcodeBusy||locating} onClick={findPostcode}>{postcodeBusy?'Buscando…':'Buscar CEP'}</button></div>
        <div className="geo-address-fields">{([['street','Rua / avenida'],['number','Número / lote / quadra'],['complement','Complemento / referência'],['district','Bairro'],['city','Cidade'],['state','UF']] as const).map(([field,label])=><label key={field}>{label}<input value={address[field]} disabled={saving||postcodeBusy} maxLength={field==='state'?2:field==='number'?40:field==='street'?180:120} onChange={e=>changeAddress(field,e.target.value)}/></label>)}</div>
        <p className="geo-help">O CEP preenche o endereço e pode sugerir uma região aproximada. O número da obra deve ser informado e o ponto precisa ser conferido.</p>
        {addressLabel(address)&&<a className="geo-external-map" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(addressLabel(address)+', Brasil')} target="_blank" rel="noopener noreferrer">Conferir endereço no Google Maps ↗</a>}
        <button type="button" disabled={saving||locating||postcodeBusy} onClick={()=>locate(true)}>Usar meu local atual como referência</button>
        {hasPoint&&<ProjectLocationMap latitude={numericLatitude} longitude={numericLongitude} radius={Number(radius)||150} disabled={saving||locating||postcodeBusy} onPick={(lat,lon)=>{setLatitude(lat.toFixed(7));setLongitude(lon.toFixed(7));setPointSource('map');setPointConfirmed(false);}}/>}
        {!hasPoint&&<p className="geo-help">Ainda não há um ponto para mostrar. Consulte o CEP, use o GPS ou informe as coordenadas abaixo.</p>}
        <details className="geo-coordinate-options"><summary>Opções avançadas: coordenadas</summary><div className="geo-fields"><label>Latitude<input inputMode="decimal" value={latitude} disabled={saving||postcodeBusy} onChange={e=>{setLatitude(e.target.value);setPointSource('manual');setPointConfirmed(false);}} placeholder="-16.6800000"/></label><label>Longitude<input inputMode="decimal" value={longitude} disabled={saving||postcodeBusy} onChange={e=>{setLongitude(e.target.value);setPointSource('manual');setPointConfirmed(false);}} placeholder="-49.2500000"/></label></div></details>
        <label>Raio de proximidade em metros<input required type="number" min="20" max="2000" step="1" inputMode="numeric" value={radius} disabled={saving} onChange={e=>setRadius(e.target.value)}/></label>
        <label className="geo-check"><input type="checkbox" checked={pointConfirmed} disabled={!hasPoint||saving||locating||postcodeBusy} onChange={e=>setPointConfirmed(e.target.checked)}/>Conferi que o ponto marcado corresponde à obra</label>
        <label className="geo-check"><input type="checkbox" checked={enabled} disabled={saving} onChange={e=>setEnabled(e.target.checked)}/>Ativar sugestão para esta obra</label><button className="primary" disabled={saving||loading||locating||postcodeBusy||!hasPoint||!pointConfirmed}>{saving?'Salvando…':'Salvar endereço e local da obra'}</button>
      </form>}
    </details>}
  </section>;
}
