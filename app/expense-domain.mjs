export const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const workName=value=>normalized(value).replace(/\bresidencial\b/g,'residencia');
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
function amount(value){let s=value.replace(/\s/g,'').replace(/(?<=\d)[.,]$/,'');if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s))s=s.replaceAll('.','');if(!/^\d{1,10}(,\d{1,2})?$/.test(s))return null;const [a,b='']=s.split(',');const n=Number(a)*100+Number(b.padEnd(2,'0'));return Number.isSafeInteger(n)&&n>0&&n<=999999999999?n:null;}
function scaledAmount(value,scale,tail=''){const rest=normalized(tail).split(' ');if(rest[0]==='reais')rest.shift();if(rest[0]==='centavos'||rest[0]==='e'&&(/^\d/.test(rest[1]||'')||numbers[rest[1]]!==undefined))return null;const base=amount(value);if(base===null)return null;const unit=normalized(scale),factor=unit==='mil'?1000:unit==='milhao'||unit==='milhoes'?1000000:1;const result=base*factor;return Number.isSafeInteger(result)&&result>0&&result<=999999999999?result:null;}
const numbers={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,quatorze:14,catorze:14,quinze:15,dezesseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100,cento:100,duzentos:200,trezentos:300,quatrocentos:400,quinhentos:500,seiscentos:600,setecentos:700,oitocentos:800,novecentos:900};
function wordsAmount(text){const tokens=normalized(text).split(' ');let total=0,current=0,seen=false;for(const word of tokens){if(word==='e')continue;if(word==='mil'){total+=(current||1)*1000;current=0;seen=true;}else if(word==='milhao'||word==='milhoes'){total+=(current||1)*1000000;current=0;seen=true;}else if(numbers[word]!==undefined){current+=numbers[word];seen=true;}else return null;}return seen?(total+current)*100:null;}
function referenceDate(timestamp,offset=0){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp));const field=type=>parts.find(p=>p.type===type).value;const date=field('year')+'-'+field('month')+'-'+field('day');return new Date(Date.parse(date+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);}
function aliases(project){return [project.code,project.name.replace(/^DEMONSTRA[ÇC][ÃA]O\s*[·:—-]\s*/i,'').replace(/\(fict[ií]cia\)/gi,'').trim()];}
export function localExpense(text,kind,projects,timestamp=Date.now()){
 const original=String(text||''),plain=normalized(original),parts=original.split('|').map(s=>s.trim());
 const command=/^\/despesa\s+(\S+)$/i.exec(parts[0]);
 let value=null;
 const total=original.match(/(?:valor informado|valor total|total)(?:\s+de)?\s*:?\s*(?:R\$\s*)?(\d[\d.,]*)(?:\s+(milh[ãa]o|milh[õo]es|mil))?\b/i);
 if(command&&parts.length===3)value=amount(command[1]);else if(total)value=scaledAmount(total[1],total[2],original.slice(total.index+total[0].length));else{
  const values=[...original.matchAll(/R\$\s*(\d[\d.,]*)(?:\s+(milh[ãa]o|milh[õo]es|mil))?\b|(\d[\d.,]*)(?:\s+(milh[ãa]o|milh[õo]es|mil))?\s+(?:de\s+)?reais\b/gi)].map(m=>scaledAmount(m[1]||m[3],m[2]||m[4],original.slice(m.index+m[0].length))).filter(Boolean);
  const unique=[...new Set(values)];if(unique.length===1)value=unique[0];
  if(!values.length){const before=plain.split(/\breais\b/)[0].trim().split(' ');const suffix=[];for(let i=before.length-1;i>=0;i--){if(numbers[before[i]]!==undefined||['e','mil','milhao','milhoes'].includes(before[i]))suffix.unshift(before[i]);else break;}if(/\breais\b/.test(plain))value=wordsAmount(suffix.join(' '));if(/\bcentavos\b/.test(plain))value=null;}
 }
 const mentioned=projects.filter(p=>aliases(p).some(a=>{const n=workName(a);return n.length>=5&&(' '+workName(original)+' ').includes(' '+n+' ');}));
 const general=/\b(administrativo geral|despesa geral|despesas gerais)\b/.test(plain);
 const unknown=original.match(/\b(?:obra|resid[eê]ncia(?:l)?)\s+([^\n,.|]{2,100})/i)?.[0]?.split(/\s+(?:por|hoje|ontem|no valor|em \d)\b/i)[0];
 const work=general?'Administrativo geral':mentioned.length===1?aliases(mentioned[0])[1]:unknown||null;
 let date=null;const iso=original.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0],br=original.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
 if(iso&&validDate(iso))date=iso;else if(br&&validDate(br[3]+'-'+br[2]+'-'+br[1]))date=br[3]+'-'+br[2]+'-'+br[1];else if(/\bhoje\b/.test(plain))date=referenceDate(timestamp);else if(/\bontem\b/.test(plain))date=referenceDate(timestamp,-1);
 const description=original.match(/^Descri[çc][ãa]o:\s*([^\n]+)/im)?.[1]||(command&&parts.length===3?parts[2]:original.trim().slice(0,1000));
 const supplier=original.match(/^Fornecedor:\s*([^\n]+)/im)?.[1]||null;
 const isExpense=!!command||/\b(comprei|compramos|compra|gastei|despesa|paguei)\b/.test(plain)||(kind==='image'&&value!==null);
 const multiple=mentioned.length>1||/\b(rateio|ratear|duas obras|varias obras)\b/.test(plain);
 return expenseDraft({tipo_registro:isExpense&&!/\b(orcamento|cotacao)\b/.test(plain)?'despesa':'incerto',obra:work,valor_centavos:value,data:date,descricao:description||null,fornecedor:supplier,categoria:null,multiplas_obras:multiple},projects);
}
export function expenseDraft(candidate,projects){
 const c=candidate||{},name=workName(c.obra);
 const matches=name.length>=5?projects.filter(p=>p.status==='active'&&aliases(p).some(a=>workName(a)===name)):[];
 const project=!c.multiplas_obras&&matches.length===1?matches[0].id:null;
 const missing=[];if(c.tipo_registro!=='despesa')missing.push('tipo de informação');if(!project)missing.push('obra');if(!Number.isSafeInteger(c.valor_centavos)||c.valor_centavos<=0)missing.push('valor');if(!validDate(c.data))missing.push('data');if(!c.descricao)missing.push('descrição');
 const questions=[];if(!project)questions.push(c.multiplas_obras?'Há mais de uma obra. Separe os valores por obra e confira uma despesa de cada vez.':c.obra?'Confirme a obra citada; ela não corresponde a uma única obra autorizada.':'Qual é a obra? Administrativo geral somente para uma despesa explicitamente geral.');if(missing.includes('valor'))questions.push('Qual é o valor exato desta despesa?');if(missing.includes('data'))questions.push('Em qual data ocorreu a despesa?');if(c.tipo_registro!=='despesa')questions.push('Confirme se esta informação representa uma despesa.');
 return {...c,project,missing,questions};
}
export function possibleDuplicates(draft,records,others=[],hashMatches=[]){
 const result=hashMatches.map(item=>({...item,reason:'Comprovante com o mesmo conteúdo'}));
 if(draft.project&&draft.valor_centavos&&draft.data){for(const r of records)if(r.type==='expense'&&r.status!=='rejected'&&r.project===draft.project&&r.amount===draft.valor_centavos&&r.date===draft.data)result.push({id:r.id,source:'record',description:r.description,reason:'Mesma obra, valor e data'});for(const item of others)if(item.draft?.project===draft.project&&item.draft?.valor_centavos===draft.valor_centavos&&item.draft?.data===draft.data)result.push({id:item.id,source:'message',description:item.draft.descricao||'Outra mensagem',reason:'Outra mensagem com mesma obra, valor e data'});}
 return result.filter((item,index)=>result.findIndex(other=>other.source===item.source&&other.id===item.id)===index);
}
