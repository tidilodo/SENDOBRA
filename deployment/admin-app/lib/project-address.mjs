const limits={cep:8,street:180,number:40,complement:120,district:120,city:120,state:2};
const states=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
export function validateAddress(value){
 if(value===undefined||value===null)return null;
 if(typeof value!=='object'||Array.isArray(value))throw Error('Endereço inválido.');
 const a={};
 for(const [key,max] of Object.entries(limits)){const raw=value[key]??'';if(typeof raw!=='string'||raw.length>max+(key==='cep'?1:0))throw Error('Confira o campo '+key+' do endereço.');a[key]=raw.trim();}
 a.cep=a.cep.replace(/-/g,'');a.state=a.state.toUpperCase();
 if(a.cep&&!/^\d{8}$/.test(a.cep))throw Error('Informe um CEP com 8 números.');
 if(a.state&&!states.has(a.state))throw Error('UF inválida.');
 return Object.values(a).some(Boolean)?a:null;
}
function text(v,max){return typeof v==='string'?v.trim().slice(0,max):'';}
export async function lookupPostcode(value,fetchImpl=fetch){
 const cep=String(value).replace(/[-\s]/g,'');
 if(!/^\d{8}$/.test(cep))throw Error('Informe um CEP com 8 números.');
 const results=await Promise.allSettled([
  fetchImpl('https://viacep.com.br/ws/'+cep+'/json/',{signal:AbortSignal.timeout(12000)}).then(async r=>{if(!r.ok)throw Error('CEP indisponível');const d=await r.json();if(d.erro||String(d.cep).replace(/\D/g,'')!==cep)throw Error('CEP não encontrado');return d;}),
  fetchImpl('https://brasilapi.com.br/api/cep/v2/'+cep,{signal:AbortSignal.timeout(12000)}).then(async r=>{if(!r.ok)throw Error('CEP indisponível');const d=await r.json();if(d.cep!==cep)throw Error('CEP inválido');return d;})
 ]);
 const via=results[0].status==='fulfilled'?results[0].value:null,br=results[1].status==='fulfilled'?results[1].value:null;
 if(!via&&!br)throw Error('Não foi possível consultar esse CEP. Confira os números ou preencha o endereço manualmente.');
 const address={cep,street:text(via?.logradouro??br?.street,180),district:text(via?.bairro??br?.neighborhood,120),city:text(via?.localidade??br?.city,120),state:text(via?.uf??br?.state,2),number:'',complement:''};
 const c=br?.location?.coordinates;
 const lat=c?.latitude,lon=c?.longitude;
 const latitude=lat!==undefined&&lat!==null&&lat!==''?Number(lat):NaN,longitude=lon!==undefined&&lon!==null&&lon!==''?Number(lon):NaN;
 const approximate=Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=-34&&latitude<=6&&longitude>=-74&&longitude<=-28?{latitude,longitude}:null;
 return {address:validateAddress(address),approximate};
}
export function addressLabel(a){return a?[a.street,a.number,a.complement,a.district,a.city,a.state,a.cep].filter(Boolean).join(', '):'';}
