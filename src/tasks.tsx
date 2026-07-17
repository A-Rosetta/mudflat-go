import {useEffect,useMemo,useState} from 'react';
import {ChevronRight,LocateFixed,Navigation,RefreshCw} from 'lucide-react';
import {getSpecies,wetlands,type Wetland} from './data';

type Position={lat:number;lng:number};
type GeoState={status:'locating'|'ready'|'blocked';position:Position|null;message:string};

const distanceKm=(from:Position,to:Position)=>{const radius=6371;const dLat=(to.lat-from.lat)*Math.PI/180;const dLng=(to.lng-from.lng)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(from.lat*Math.PI/180)*Math.cos(to.lat*Math.PI/180)*Math.sin(dLng/2)**2;return radius*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))};
const formatDistance=(value:number)=>value<1?`${Math.round(value*1000)} m`:`${value.toFixed(1)} km`;

export function TasksView({onOpen,unlockedLocationCount=2}:{onOpen:(item:Wetland)=>void;unlockedLocationCount?:number}){
 const [geo,setGeo]=useState<GeoState>({status:'locating',position:null,message:'正在读取当前位置'});
 const locate=()=>{if(!navigator.geolocation){setGeo({status:'blocked',position:null,message:'无法识别位置，已显示全市可完成任务'});return}setGeo({status:'locating',position:null,message:'正在读取当前位置'});navigator.geolocation.getCurrentPosition(position=>setGeo({status:'ready',position:{lat:position.coords.latitude,lng:position.coords.longitude},message:'已按当前位置生成任务'}),()=>setGeo({status:'blocked',position:null,message:'无法识别位置，已显示全市可完成任务'}),{enableHighAccuracy:true,timeout:9000,maximumAge:30000})};
 useEffect(locate,[]);
 const ranked=useMemo(()=>wetlands.map(item=>({item,distance:geo.position?distanceKm(geo.position,{lat:item.lat,lng:item.lng}):Number.POSITIVE_INFINITY})).sort((a,b)=>a.distance-b.distance),[geo.position]);
 return <section className="task-page page-enter"><div className="task-hero"><span className="eyebrow"><LocateFixed size={14}/>附近生态任务</span><h1>附近可完成任务</h1><p>{geo.message}</p><button className="secondary" onClick={locate}><RefreshCw size={16}/>重新定位</button></div>{geo.status==='blocked'&&<div className="gps-empty task-warning"><LocateFixed/><b>无法识别位置</b><span>仍然显示 6 个深圳湿地任务；到达点位后再完成 GPS 校验与拍照识别。</span></div>}<div className="task-list">{ranked.map(({item,distance},index)=>{const routeIndex=wetlands.findIndex(wetland=>wetland.id===item.id);const locked=routeIndex>=unlockedLocationCount;return <TaskCard key={item.id} item={item} distance={distance} rank={index+1} locked={locked} onOpen={()=>onOpen(item)}/>})}</div></section>
}

function TaskCard({item,distance,rank,locked,onOpen}:{item:Wetland;distance:number;rank:number;locked:boolean;onOpen:()=>void}){
 const target=getSpecies(item.species[0]);const unknown=!Number.isFinite(distance);const onsite=distance<=.5;const reachable=distance<=3;const status=locked?'路线未解锁':unknown?'无法识别位置':onsite?'现场可完成':reachable?'附近可抵达':'到达后解锁';const task=locked?'先完成前一站，再开启这里的点位任务':unknown?'先选择湿地点位，现场打开相机即可完成任务':onsite?'完成 GPS 校验并拍摄目标物种':reachable?'前往点位，锁定一张推荐图鉴':'规划路线，到达湿地后完成捕捉';
 return <article data-testid="task-card" className={`task-card ${onsite?'ready':''} ${unknown?'unknown':''} ${locked?'locked':''}`}><div className="task-rank">{rank}</div><div className="task-copy"><header><b>{item.name}</b><span>{unknown?'位置未知':locked?'未解锁':formatDistance(distance)}</span></header><p>{task}</p><div><em>{status}</em><small>推荐目标：{target.name} · {item.limited}</small></div></div><button data-testid="task-open" disabled={locked} onClick={onOpen} aria-label={`查看${item.name}任务`}><Navigation size={16}/><ChevronRight size={16}/></button></article>
}
