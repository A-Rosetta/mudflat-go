import {useEffect,useState} from 'react';
import {Grid2X2,ListChecks,Map,Sparkles,UserRound} from 'lucide-react';
import {getSpecies,species,wetlands,type Species,type Wetland} from './data';
import {CaptureView,LocationView,MapView,TargetView} from './views';
import {CardReveal} from './collection';
import {CollectionView} from './atlas';
import {ProfileView} from './profile';
import {TasksView} from './tasks';
type View='map'|'location'|'target'|'capture'|'collection'|'tasks'|'profile';
const readStorage=<T,>(key:string,fallback:T):T=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value) as T:fallback}catch{return fallback}};
const todayKey=()=>new Date().toLocaleDateString('en-CA');
export default function App(){
 const [view,setView]=useState<View>('map');const [location,setLocation]=useState<Wetland>(wetlands[0]);const [target,setTarget]=useState<Species>(species[0]);const [unlocked,setUnlocked]=useState<string[]>(()=>readStorage('mudflat-unlocked',['egret','fiddler']));const [levels,setLevels]=useState<Record<string,number>>(()=>readStorage('mudflat-levels',{egret:1,fiddler:1}));const [score,setScore]=useState(()=>readStorage('mudflat-score',1280));const [lastGift,setLastGift]=useState(()=>readStorage('mudflat-daily-gift',''));const [routeProgress,setRouteProgress]=useState(()=>readStorage('mudflat-route-progress',2));const [showCard,setShowCard]=useState(false);const [flipped,setFlipped]=useState(false);const [cardSource,setCardSource]=useState<'capture'|'atlas'>('atlas');
 const giftClaimed=lastGift===todayKey();const unlockedLocationCount=Math.max(1,Math.min(wetlands.length,routeProgress));
 useEffect(()=>{localStorage.setItem('mudflat-unlocked',JSON.stringify(unlocked));localStorage.setItem('mudflat-levels',JSON.stringify(levels));localStorage.setItem('mudflat-score',JSON.stringify(score));localStorage.setItem('mudflat-daily-gift',JSON.stringify(lastGift));localStorage.setItem('mudflat-route-progress',JSON.stringify(routeProgress))},[unlocked,levels,score,lastGift,routeProgress]);
 const top=()=>window.scrollTo(0,0);const bumpLevel=(id:string)=>setLevels(items=>({...items,[id]:Math.min(5,(items[id]??0)+1)}));const openLocation=(item:Wetland)=>{setLocation(item);setView('location');top()};const chooseTarget=(item:Species)=>{setTarget(item);setView('target');top()};const advanceRoute=()=>{if(cardSource!=='capture')return;const routeIndex=wetlands.findIndex(item=>item.id===location.id);setRouteProgress(value=>routeIndex===value-1?Math.min(wetlands.length,value+1):value)};const collect=()=>{advanceRoute();if(!unlocked.includes(target.id)){setUnlocked(items=>[...items,target.id]);setLevels(items=>({...items,[target.id]:Math.max(items[target.id]??0,1)}));setScore(value=>value+350)}else{bumpLevel(target.id);setScore(value=>value+120)}setShowCard(false);setView('collection');top()};const claimDailyGift=()=>{if(giftClaimed)return;const first=unlocked[0];if(first)bumpLevel(first);setScore(value=>value+120);setLastGift(todayKey())};const goMap=()=>{setView('map');top()};
 return <div className="app-shell"><header className="topbar"><button className="brand" onClick={goMap} aria-label="返回探索地图"><span className="brand-mark"><img src="/brand-logo.png" alt=""/></span><span><b>Mudflat Go!</b><small>滩涂大冒险</small></span></button><div className="top-stats"><span><Sparkles size={15}/>{score.toLocaleString()}</span><span>{unlocked.length}/30 图鉴</span></div></header><main>
  {view==='map'&&<MapView onOpen={openLocation} onCollection={()=>setView('collection')} unlockedLocationCount={unlockedLocationCount}/>} 
  {view==='location'&&<LocationView location={location} onBack={goMap} onChoose={chooseTarget}/>} 
  {view==='target'&&<TargetView item={target} location={location} onBack={()=>setView('location')} onStart={()=>setView('capture')}/>} 
  {view==='capture'&&<CaptureView item={target} candidates={location.species.map(getSpecies)} onBack={()=>setView('target')} onSuccess={found=>{setTarget(found);setFlipped(false);setCardSource('capture');setShowCard(true)}}/>}
  {view==='collection'&&<CollectionView unlocked={unlocked} levels={levels} score={score} giftClaimed={giftClaimed} onClaimGift={claimDailyGift} onSelect={item=>{setTarget(item);setFlipped(false);setCardSource('atlas');setShowCard(true)}}/>}
  {view==='tasks'&&<TasksView unlockedLocationCount={unlockedLocationCount} onOpen={openLocation}/>}
  {view==='profile'&&<ProfileView unlockedCount={unlocked.length} score={score} routeProgress={unlockedLocationCount} onMap={goMap} onAtlas={()=>setView('collection')}/>}
 </main>{view!=='capture'&&<nav className="bottom-nav p0-nav" aria-label="主导航"><button className={view==='map'?'active':''} onClick={goMap}><Map size={20}/><span>探索</span></button><button className={view==='collection'?'active':''} onClick={()=>setView('collection')}><Grid2X2 size={20}/><span>图鉴</span></button><button className={view==='tasks'?'active':''} onClick={()=>setView('tasks')}><ListChecks size={20}/><span>任务</span></button><button className={view==='profile'?'active':''} onClick={()=>setView('profile')}><UserRound size={20}/><span>我的</span></button></nav>}
 {showCard&&<CardReveal item={target} level={levels[target.id]??0} flipped={flipped} onFlip={()=>setFlipped(value=>!value)} onClose={()=>setShowCard(false)} onCollect={collect} collected={unlocked.includes(target.id)} canCollect={cardSource==='capture'}/>} 
 </div>
}
