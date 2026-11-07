'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map as LeafletMap,Marker,Circle} from 'leaflet';
export default function ProjectLocationMap({latitude,longitude,radius,onPick,disabled}:{latitude:number,longitude:number,radius:number,onPick:(lat:number,lon:number)=>void,disabled:boolean}){
 const container=useRef<HTMLDivElement>(null),map=useRef<LeafletMap|null>(null),marker=useRef<Marker|null>(null),circle=useRef<Circle|null>(null),pick=useRef(onPick),blocked=useRef(disabled),latest=useRef({latitude,longitude,radius});
 const [error,setError]=useState('');
 pick.current=onPick;blocked.current=disabled;latest.current={latitude,longitude,radius};
 useEffect(()=>{
  let cancelled=false;
  import('leaflet').then(L=>{
   if(cancelled||!container.current)return;
   const p=latest.current;
   const m=L.map(container.current,{scrollWheelZoom:false}).setView([p.latitude,p.longitude],17);map.current=m;
   L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',referrerPolicy:'strict-origin-when-cross-origin'}).addTo(m).on('tileerror',()=>setError('O mapa está indisponível. Você pode conferir as coordenadas ou tentar novamente.'));
   const icon=L.divIcon({className:'geo-map-pin',html:'<span aria-hidden="true"></span>',iconSize:[28,36],iconAnchor:[14,36]});
   const pin=L.marker([p.latitude,p.longitude],{icon,draggable:!blocked.current,title:'Ponto da obra: arraste para ajustar',alt:'Ponto da obra'}).addTo(m);marker.current=pin;
   const area=L.circle([p.latitude,p.longitude],{radius:p.radius,color:'#285e4a',fillOpacity:0.08}).addTo(m);circle.current=area;
   function update(lat:number,lon:number){if(blocked.current)return;pin.setLatLng([lat,lon]);area.setLatLng([lat,lon]);pick.current(lat,lon);}
   m.on('click',e=>update(e.latlng.lat,e.latlng.lng));pin.on('dragend',()=>{const p=pin.getLatLng();update(p.lat,p.lng);});
   const observer=new ResizeObserver(()=>m.invalidateSize());observer.observe(container.current);
   (m as any).__resizeObserver=observer;
  }).catch(()=>{if(!cancelled)setError('Não foi possível abrir o mapa. Informe as coordenadas ou tente novamente.');});
  return()=>{cancelled=true;(map.current as any)?.__resizeObserver?.disconnect();map.current?.remove();map.current=null;marker.current=null;circle.current=null;};
 },[]);
 useEffect(()=>{const point:[number,number]=[latitude,longitude];marker.current?.setLatLng(point);circle.current?.setLatLng(point);circle.current?.setRadius(radius);const m=map.current;if(m&&!m.getBounds().contains(point))m.panTo(point);},[latitude,longitude,radius]);
 useEffect(()=>{if(disabled)marker.current?.dragging?.disable();else marker.current?.dragging?.enable();},[disabled]);
 return <div className="geo-map-wrap"><p>Toque no mapa ou arraste o marcador até a entrada da obra. O círculo mostra o raio de proximidade.</p><div ref={container} className="geo-map" role="region" aria-label="Mapa para ajustar o ponto da obra"/>{error&&<p role="alert">{error}</p>}<small>Mapa: OpenStreetMap. <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Informar erro no mapa</a></small></div>;
}
