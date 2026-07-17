import {useMemo,useState} from 'react';
import {Bird,ChevronRight,Gift,Grid2X2,Leaf,Search,Sparkles,Waves} from 'lucide-react';
import {species,type Rarity,type Species,type SpeciesType} from './data';
import {rarityClass} from './views';
import {SpeciesImage} from './species-image';
type Props={unlocked:string[];levels:Record<string,number>;score:number;giftClaimed:boolean;onSelect:(item:Species)=>void;onClaimGift:()=>void};

export function CollectionView({unlocked,levels,score,giftClaimed,onSelect,onClaimGift}:Props){
 const [filter,setFilter]=useState<'全部'|SpeciesType>('全部');const [rarity,setRarity]=useState<'全部'|Rarity>('全部');const [query,setQuery]=useState('');const [supplyOpened,setSupplyOpened]=useState(false);
 const items=useMemo(()=>species.filter(item=>(filter==='全部'||item.type===filter)&&(rarity==='全部'||item.rarity===rarity)&&(item.name.includes(query)||item.location.includes(query))),[filter,rarity,query]);
 const counts=(type:SpeciesType)=>species.filter(item=>item.type===type&&unlocked.includes(item.id)).length;
 const claimSupply=()=>{setSupplyOpened(true);onClaimGift()};
 return <section className="collection-page atlas-page page-enter"><div className="collection-hero atlas-hero"><div><span className="eyebrow"><Grid2X2 size={14}/>深圳生命图鉴</span><h1>深圳湿地图鉴</h1><p>收集、升级、分享真实湿地发现。非现场识别不能直接收入图鉴。</p><div className="atlas-level"><span>湿地观察手册</span><i><b style={{width:`${Math.min(100,score/20)}%`}}/></i><em>{score}/2000 XP</em></div>{(supplyOpened||giftClaimed)&&<div className="supply-receipt"><Gift size={14}/>{supplyOpened?'补给箱已打开：+120 XP，并强化一张已发现卡。':'今日补给已领取，明天再刷新。'}</div>}</div><div className="hero-progress"><div className="progress-orbit" data-testid="atlas-progress"><strong>{unlocked.length}<small>/30</small></strong><span>已收集</span></div><button data-testid="daily-supply" onClick={claimSupply} disabled={giftClaimed}><Gift size={17}/>{giftClaimed?'今日补给已领取':'打开生态补给箱'}</button></div></div>
  <AtlasContent items={items} unlocked={unlocked} levels={levels} filter={filter} rarity={rarity} query={query} counts={counts} setFilter={setFilter} setRarity={setRarity} setQuery={setQuery} onSelect={onSelect}/> 
 </section>
}

type AtlasProps={items:Species[];unlocked:string[];levels:Record<string,number>;filter:'全部'|SpeciesType;rarity:'全部'|Rarity;query:string;counts:(type:SpeciesType)=>number;setFilter:(value:'全部'|SpeciesType)=>void;setRarity:(value:'全部'|Rarity)=>void;setQuery:(value:string)=>void;onSelect:(item:Species)=>void};
function AtlasContent({items,unlocked,levels,filter,rarity,query,counts,setFilter,setRarity,setQuery,onSelect}:AtlasProps){
 return <><div className="atlas-stats"><Stat icon={<Bird/>} label="鸟类图鉴" value={`${counts('鸟类')}/10`} color="#8de4ff"/><Stat icon={<Leaf/>} label="红树植物" value={`${counts('树木')}/10`} color="#b7ff5a"/><Stat icon={<Waves/>} label="滩涂生命" value={`${counts('滩涂生物')}/10`} color="#ffc06d"/></div><div className="atlas-toolbar"><div className="atlas-filters">{(['全部','鸟类','树木','滩涂生物'] as const).map(type=><button className={filter===type?'active':''} onClick={()=>setFilter(type)} key={type}>{type}</button>)}</div><label className="atlas-search"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索物种或点位"/></label><select value={rarity} onChange={event=>setRarity(event.target.value as '全部'|Rarity)} aria-label="稀有度筛选"><option>全部</option><option>常见</option><option>稀有</option><option>超稀有</option></select></div><div className="collection-grid atlas-grid">{items.map(item=><AtlasCard key={item.id} item={item} level={levels[item.id]??0} unlocked={unlocked.includes(item.id)} onClick={()=>onSelect(item)}/>)}</div>{items.length===0&&<div className="empty-atlas"><Search/><b>没有找到对应物种</b><span>换个名称或筛选条件试试。</span></div>}</>
}
function Stat({icon,label,value,color}:{icon:React.ReactNode;label:string;value:string;color:string}){return <div style={{'--stat-color':color} as React.CSSProperties}><span>{icon}</span><p><b>{value}</b><small>{label}</small></p><i/></div>}

function AtlasCard({item,unlocked,level,onClick}:{item:Species;unlocked:boolean;level:number;onClick:()=>void}){
 const displayLevel=unlocked?Math.max(1,level):0;
 return <button data-testid="collection-card" className={`collection-card atlas-card ${unlocked?'unlocked':'locked'} ${rarityClass[item.rarity]}`} onClick={()=>unlocked&&onClick()} aria-disabled={!unlocked} aria-label={`${unlocked?'查看':'未解锁'}${item.name}`}><div className="card-image"><SpeciesImage item={item} locked={!unlocked} alt={unlocked?item.name:`${item.name}线稿`}/><span className="card-texture"/><header><b>{item.no}</b><em className={rarityClass[item.rarity]}>{item.rarity}</em></header>{unlocked&&<div className="found-stamp"><Sparkles size={12}/>{levelName(displayLevel)}</div>}</div><div className="card-info"><div><span>{item.type}</span><em data-testid={`card-level-${item.id}`}>Lv.{displayLevel} {levelName(displayLevel)}</em></div><h3>{item.name}</h3><p>{item.tagline}</p><footer><span>{unlocked?levelHint(displayLevel):item.habitat}</span>{unlocked&&<ChevronRight size={14}/>}</footer></div></button>
}
const levelName=(level:number)=>level===0?'未发现':level===1?'初遇':level===2?'认识':level===3?'观察':level===4?'记录':'守护';
const levelHint=(level:number)=>level>=5?'已完成守护记录':level>=3?'继续二次观察可升级':'再完成一次真实识别可成长';
