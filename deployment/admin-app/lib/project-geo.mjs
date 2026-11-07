export function validateLocation(value) {
  const {latitude,longitude,radius}=value||{};
  if(typeof latitude!=='number'||!Number.isFinite(latitude)||Math.abs(latitude)>90)throw Error('Latitude inválida.');
  if(typeof longitude!=='number'||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw Error('Longitude inválida.');
  if(typeof radius!=='number'||!Number.isInteger(radius)||radius<20||radius>2000)throw Error('Use um raio entre 20 e 2.000 metros.');
  return {latitude,longitude,radius};
}
export function distanceMeters(a,b) {
  const rad=v=>v*Math.PI/180;
  const x=Math.sin(rad(b.latitude-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(Math.min(1,x)),Math.sqrt(Math.max(0,1-x)));
}
export function suggestProjects(position,locations) {
  if(!position||!Number.isFinite(position.latitude)||Math.abs(position.latitude)>90||!Number.isFinite(position.longitude)||Math.abs(position.longitude)>180||!Number.isFinite(position.accuracy)||position.accuracy<0)return {state:'unavailable',candidates:[]};
  const candidates=locations.filter(l=>l&&l.enabled!==false).flatMap(l=>{
    try{validateLocation(l);}catch{return [];}
    const distance=distanceMeters(position,l);
    return distance-position.accuracy<=l.radius?[{...l,distance:Math.round(distance),confident:position.accuracy<=100&&distance+position.accuracy<=l.radius}]:[];
  }).sort((a,b)=>a.distance-b.distance);
  return {state:!candidates.length?'outside':candidates.length>1?'ambiguous':candidates[0].confident?'suggested':'imprecise',candidates};
}
