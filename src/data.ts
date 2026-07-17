export type Rarity='常见'|'稀有'|'超稀有';
export type SpeciesType='鸟类'|'树木'|'滩涂生物';
export type Species={id:string;no:string;name:string;latin:string;type:SpeciesType;rarity:Rarity;season:string;location:string;image:string;imageSource:string;tagline:string;habitat:string;route:string;importance:string;color:string};
export type Wetland={id:string;name:string;short:string;distance:string;limited:string;species:string[];x:number;y:number;lat:number;lng:number;accent:string};
export const species:Species[]=[
 {id:'spoonbill',no:'SZ-001',name:'黑脸琵鹭',latin:'Platalea minor',type:'鸟类',rarity:'超稀有',season:'10月—次年4月',location:'福田红树林 · 深圳湾',image:'https://upload.wikimedia.org/wikipedia/commons/b/bc/Black_faced_spoonbill_at_Niigata.JPG',imageSource:'Wikimedia Commons · Black-faced spoonbill',tagline:'全球珍稀的“黑面舞者”',habitat:'喜欢潮间带浅水区，用像汤匙一样的长嘴左右扫动找食物。',route:'每年沿东亚—澳大利西亚迁飞路线抵达深圳越冬。',importance:'红树林像一座海边食堂：潮水送来鱼虾，安静滩涂让它安心补充体力。',color:'#b7ff5a'},
 {id:'egret',no:'SZ-002',name:'白鹭',latin:'Egretta garzetta',type:'鸟类',rarity:'常见',season:'全年',location:'深圳六大湿地',image:'https://upload.wikimedia.org/wikipedia/commons/f/f1/Little_egret_%28Egretta_garzetta%29_Photograph_by_Shantanu_Kuveskar.jpg',imageSource:'Wikimedia Commons · Little egret',tagline:'湿地里的白色闪电',habitat:'常在浅水边慢慢走动，一发现小鱼就迅速出击。',route:'部分种群留居深圳，也有迁徙伙伴在冬季加入。',importance:'健康的浅滩能提供足够小鱼，也让白鹭成为最容易观察的湿地向导。',color:'#e8fff8'},
 {id:'heron',no:'SZ-003',name:'池鹭',latin:'Ardeola bacchus',type:'鸟类',rarity:'常见',season:'3月—10月',location:'深圳湾公园 · 海上田园',image:'https://upload.wikimedia.org/wikipedia/commons/6/63/Chinese_Pond_Heron_in_Summer.jpg',imageSource:'Wikimedia Commons · Chinese pond heron',tagline:'会“变装”的水边猎手',habitat:'繁殖季头颈会换上栗红色新装，安静守在岸边等待猎物。',route:'在华南常见，随季节在城市湿地之间移动。',importance:'水草、浅滩和小鱼共同组成它需要的完整餐桌。',color:'#ffd18f'},
 {id:'cormorant',no:'SZ-004',name:'鸬鹚',latin:'Phalacrocorax carbo',type:'鸟类',rarity:'稀有',season:'11月—次年3月',location:'深圳湾公园 · 西湾红树林',image:'https://upload.wikimedia.org/wikipedia/commons/c/c3/2021-05-05_Phalacrocorax_carbo_carbo%2C_Killingworth_Lake%2C_Northumberland_1-1.jpg',imageSource:'Wikimedia Commons · Great cormorant',tagline:'潜水后会晾翅膀的捕鱼高手',habitat:'擅长潜水追鱼，上岸后常张开翅膀晒干羽毛。',route:'冬季从北方来到深圳湾补给和越冬。',importance:'开阔水面与丰富鱼群，是它长途迁徙后的能量站。',color:'#84e6ff'},
 {id:'kandelia',no:'SZ-011',name:'秋茄',latin:'Kandelia obovata',type:'树木',rarity:'常见',season:'全年',location:'福田红树林',image:'https://upload.wikimedia.org/wikipedia/commons/3/3c/Kandelia_obovata_at_Ting_Kok_mangrove.JPG',imageSource:'Wikimedia Commons · Kandelia obovata',tagline:'把幼苗挂在树上的红树',habitat:'种子还在母树上就开始发芽，成熟后落进泥滩扎根。',route:'深圳本土红树植物，是湿地海岸的重要成员。',importance:'盘根减缓海浪、固定泥沙，也给小鱼小蟹提供藏身处。',color:'#90d478'},
 {id:'aegiceras',no:'SZ-012',name:'桐花树',latin:'Aegiceras corniculatum',type:'树木',rarity:'稀有',season:'春夏花期',location:'福田红树林 · 东涌湿地',image:'https://upload.wikimedia.org/wikipedia/commons/0/0e/Aegiceras_corniculatum_Blanco1_38_cropped.jpg',imageSource:'Wikimedia Commons · Aegiceras corniculatum',tagline:'果实像小羊角的耐盐树',habitat:'能把多余盐分排出叶片，在海水与淡水交会处生长。',route:'沿华南潮间带分布，花朵为昆虫提供食物。',importance:'它是红树林群落的前线成员，帮助海岸抵御风浪。',color:'#ffe171'},
 {id:'avicennia',no:'SZ-013',name:'白骨壤',latin:'Avicennia marina',type:'树木',rarity:'超稀有',season:'全年',location:'西湾红树林 · 海上田园',image:'https://upload.wikimedia.org/wikipedia/commons/b/b5/Mature_mangrove_tree_%28Avicennia_marina%29_at_edge_of_Lake_Be_Malae.jpg',imageSource:'Wikimedia Commons · Avicennia marina',tagline:'会从泥里伸出“呼吸管”',habitat:'根系向上长出呼吸根，退潮时像一片从泥滩冒出的铅笔。',route:'耐盐、耐淹，是热带和亚热带海岸的生存高手。',importance:'呼吸根减缓水流，也构成幼鱼与底栖动物的庇护所。',color:'#b7d5b0'},
 {id:'heritiera',no:'SZ-014',name:'银叶树',latin:'Heritiera littoralis',type:'树木',rarity:'超稀有',season:'全年',location:'坝光银叶树',image:'https://upload.wikimedia.org/wikipedia/commons/1/1a/Sakishimasuo_200708.jpg',imageSource:'Wikimedia Commons · Heritiera littoralis',tagline:'叶背闪银光的海岸古树',habitat:'叶片背面覆盖银白色鳞片，风吹时整片树冠会闪光。',route:'坝光保存着深圳珍贵的古银叶树群落。',importance:'古树记录海岸变迁，也为鸟类和昆虫提供稳定家园。',color:'#d9efe4'},
 {id:'fiddler',no:'SZ-021',name:'招潮蟹',latin:'Uca spp.',type:'滩涂生物',rarity:'常见',season:'4月—10月',location:'福田红树林 · 东涌湿地',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Uca%20arcuata%20male.jpg',imageSource:'Wikimedia Commons · Fiddler crab',tagline:'举着大钳子打招呼的泥滩明星',habitat:'雄蟹一只螯特别大，会挥动它吸引同伴、宣告领地。',route:'跟着潮水作息，退潮出洞觅食，涨潮回家。',importance:'翻动泥土、分解有机物，是滩涂里的小小清洁工。',color:'#ff9d61'},
 {id:'mudskipper',no:'SZ-022',name:'弹涂鱼',latin:'Periophthalmus spp.',type:'滩涂生物',rarity:'稀有',season:'5月—10月',location:'西湾红树林 · 东涌湿地',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Periophthalmus%20barbarus.jpg',imageSource:'Wikimedia Commons · Mudskipper',tagline:'会在泥上“散步”的鱼',habitat:'能用胸鳍支撑身体，在湿润泥滩跳跃和移动。',route:'在水陆交界生活，是观察潮间带适应力的最佳主角。',importance:'完整潮沟和干净泥滩，才能让它自由往返水陆。',color:'#73e0d1'},
 {id:'shell',no:'SZ-023',name:'滩涂贝类',latin:'Bivalvia',type:'滩涂生物',rarity:'常见',season:'全年',location:'深圳湾公园 · 海上田园',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Bivalvia%20-%20Mactra%20stultorum.JPG',imageSource:'Wikimedia Commons · Bivalvia representative',tagline:'藏在泥沙里的滤水队',habitat:'多数时间埋在泥沙里，用水管过滤海水中的微小食物。',route:'不会远行，却会记录每一次潮涨潮落。',importance:'它们过滤水体，也是许多候鸟的重要能量来源。',color:'#e9c9a4'},
 {id:'fish',no:'SZ-024',name:'滩涂小鱼',latin:'Gobiidae',type:'滩涂生物',rarity:'超稀有',season:'春夏',location:'福田红树林 · 西湾红树林',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Gobius%20niger.jpg',imageSource:'Wikimedia Commons · Gobiidae representative',tagline:'红树林根系间的幼儿园住客',habitat:'幼鱼在潮沟和红树根之间躲避天敌、寻找食物。',route:'随潮水进入林下，退潮前回到更深水域。',importance:'红树林根系越完整，幼鱼的安全空间就越大。',color:'#65cfff'}
];
const extraSpecies:[string,string,string,SpeciesType,Rarity,string,string,string,string][]=[
 ['grey-heron','SZ-005','苍鹭','鸟类','稀有','冬季','深圳湾公园','像雕塑一样守在浅滩','苍鹭会耐心站在浅水边，等待鱼群靠近。'],
 ['avocet','SZ-006','反嘴鹬','鸟类','超稀有','11月—3月','福田红树林','弯嘴向上扫过水面','它用向上弯曲的长嘴在浅水中扫食小动物。'],
 ['stilt','SZ-007','黑翅长脚鹬','鸟类','稀有','春秋迁徙季','海上田园','踩着红色高跷的涉禽','超长双腿让它能进入更深的浅水区寻找食物。'],
 ['gull','SZ-008','红嘴鸥','鸟类','常见','冬季','深圳湾公园','跟着海风抵达深圳','冬季常成群飞过深圳湾，是亲子观鸟的醒目标志。'],
 ['kingfisher','SZ-009','普通翠鸟','鸟类','超稀有','全年','东涌湿地','掠过水面的蓝色宝石','它停在枝头锁定小鱼，再像箭一样扎入水中。'],
 ['white-throat','SZ-010','白胸翡翠','鸟类','超稀有','4月—9月','坝光银叶树','红嘴蓝背的林间猎手','不仅捕鱼，也会捕捉昆虫和小型滩涂动物。'],
 ['excoecaria','SZ-015','海漆','树木','稀有','全年','福田红树林','叶片会随季节变红','它的汁液需要避免触碰，却是红树林重要成员。'],
 ['bruguiera','SZ-016','木榄','树木','超稀有','全年','东涌湿地','胎生幼苗的海岸建筑师','长长的胚轴掉进泥地后，能快速扎根抵抗潮水。'],
 ['acanthus','SZ-017','老鼠簕','树木','常见','春夏花期','西湾红树林','带刺叶片守在林缘','紫白花朵吸引昆虫，果实成熟时会弹射种子。'],
 ['clerodendrum','SZ-018','苦郎树','树木','常见','春夏花期','海上田园','湿地边缘的淡紫花墙','它耐盐耐风，为红树林外缘增加植物层次。'],
 ['hibiscus','SZ-019','黄槿','树木','稀有','夏秋花期','深圳湾公园','一天会变色的海岸花','花朵从黄色逐渐转橙红，像记录一天的潮汐。'],
 ['pandanus','SZ-020','露兜树','树木','超稀有','全年','东涌湿地','用支柱根站稳海岸','粗壮支柱根帮助它抵御海风，也提供动物藏身处。'],
 ['worm','SZ-025','沙蚕','滩涂生物','常见','全年','福田红树林','泥滩下的隐形工程师','它在泥中钻洞，让氧气进入沉积物，是候鸟的重要食物。'],
 ['snail','SZ-026','滩涂螺类','滩涂生物','常见','全年','西湾红树林','背着小房子的清洁队','螺类刮食藻类和有机碎屑，维持泥滩表面洁净。'],
 ['anemone','SZ-027','海葵','滩涂生物','超稀有','低潮时段','东涌湿地','退潮后收起触手的花','看似植物，其实是会用触手捕食的海洋动物。'],
 ['barnacle','SZ-028','藤壶','滩涂生物','常见','全年','深圳湾公园','牢牢粘住礁石的滤食者','涨潮时伸出羽毛状附肢过滤食物，退潮时紧闭外壳。'],
 ['starfish','SZ-029','海星','滩涂生物','超稀有','春夏低潮','东涌湿地','拥有再生能力的潮池明星','它用管足缓慢移动，是健康潮池生态的醒目标志。'],
 ['jellyfish','SZ-030','海月水母','滩涂生物','稀有','春夏','深圳湾公园','透明身体里的四叶草','四个马蹄形生殖腺像花瓣，顺着海流缓慢漂浮。']
];
const preciseImages:Record<string,[string,string,string]>={
 'grey-heron':['Ardea cinerea','https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Grey_heron_2022_03_18_01.jpg/3840px-Grey_heron_2022_03_18_01.jpg','Wikimedia Commons · Grey heron'],
 avocet:['Recurvirostra avosetta','https://upload.wikimedia.org/wikipedia/commons/c/c5/Pied_Avocet_Recurvirostra_avosetta.jpg','Wikimedia Commons · Pied avocet'],
 stilt:['Himantopus himantopus','https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Black-winged_stilt_%28Himantopus_himantopus%29_Pearaing.jpg/3840px-Black-winged_stilt_%28Himantopus_himantopus%29_Pearaing.jpg','Wikimedia Commons · Black-winged stilt'],
 gull:['Chroicocephalus ridibundus','https://upload.wikimedia.org/wikipedia/commons/2/29/Chroicocephalus_ridibundus_%28summer%29.jpg','Wikimedia Commons · Black-headed gull'],
 kingfisher:['Alcedo atthis','https://upload.wikimedia.org/wikipedia/commons/b/bc/Alcedo_atthis_-England-8_%28cropped%29.jpg','Wikimedia Commons · Common kingfisher'],
 'white-throat':['Halcyon smyrnensis','https://upload.wikimedia.org/wikipedia/commons/c/c8/White-throated_kingfisher_%28Halcyon_smyrnensis%29_Galle.jpg','Wikimedia Commons · White-throated kingfisher'],
 excoecaria:['Excoecaria agallocha','https://upload.wikimedia.org/wikipedia/commons/2/21/Excoecaria_agallocha_%28Blind_Your_Eye%29_W_IMG_6929.jpg','Wikimedia Commons · Excoecaria agallocha'],
 bruguiera:['Bruguiera gymnorhiza','https://upload.wikimedia.org/wikipedia/commons/7/72/Bruguiera_gymnorrhiza.jpg','Wikimedia Commons · Bruguiera gymnorhiza'],
 acanthus:['Acanthus ilicifolius','https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Acanthus_ilicifolius_fruit.jpg/3840px-Acanthus_ilicifolius_fruit.jpg','Wikimedia Commons · Acanthus ilicifolius'],
 clerodendrum:['Volkameria inermis','https://upload.wikimedia.org/wikipedia/commons/2/22/Volkameria_inermis_308123521.jpg','Wikimedia Commons · Volkameria inermis'],
 hibiscus:['Hibiscus tiliaceus','https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Fleur_de_p%C5%ABrau_%28hibiscus_tiliaceus%29.jpg/3840px-Fleur_de_p%C5%ABrau_%28hibiscus_tiliaceus%29.jpg','Wikimedia Commons · Hibiscus tiliaceus'],
 pandanus:['Pandanus odorifer','https://upload.wikimedia.org/wikipedia/commons/1/1a/Pandanu_odori_111025-19693_bml.JPG','Wikimedia Commons · Pandanus odorifer'],
 worm:['Polychaeta','https://commons.wikimedia.org/wiki/Special:FilePath/Polychaete%20worm.jpg','Wikimedia Commons · Polychaete representative'],
 snail:['Cerithidea','https://commons.wikimedia.org/wiki/Special:FilePath/Cerithidea%20cingulata.jpg','Wikimedia Commons · Cerithidea representative'],
 anemone:['Actiniaria','https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20anemone%20in%20a%20tidepool.jpg','Wikimedia Commons · Sea anemone representative'],
 barnacle:['Cirripedia','https://commons.wikimedia.org/wiki/Special:FilePath/Barnacles%20on%20rocks.jpg','Wikimedia Commons · Barnacle representative'],
 starfish:['Asteroidea','https://commons.wikimedia.org/wiki/Special:FilePath/Fromia%20monilis.jpg','Wikimedia Commons · Starfish representative'],
 jellyfish:['Aurelia aurita','https://commons.wikimedia.org/wiki/Special:FilePath/Aurelia%20aurita%20%28aka%29.jpg','Wikimedia Commons · Aurelia aurita']
};
extraSpecies.forEach(([id,no,name,type,rarity,season,location,tagline,habitat])=>{const [latin,image,imageSource]=preciseImages[id];species.push({id,no,name,latin,type,rarity,season,location,image,imageSource,tagline,habitat,route:`在${location}完成季节观察任务可提高发现概率。`,importance:'它与潮汐、红树林和其他物种相互连接，是深圳湿地食物网的一部分。',color:type==='鸟类'?'#9fe8ff':type==='树木'?'#b7e389':'#ffbd79'})});
export const wetlands:Wetland[]=[
 {id:'futian',name:'福田红树林',short:'候鸟核心保护区',distance:'3.2 km',limited:'黑脸琵鹭限定',species:['spoonbill','egret','kandelia','fiddler'],x:38,y:58,lat:22.511874,lng:114.04258,accent:'#b7ff5a'},
 {id:'bay',name:'深圳湾公园',short:'城市海岸观鸟长廊',distance:'5.8 km',limited:'鸬鹚季节卡',species:['spoonbill','egret','heron','cormorant'],x:49,y:47,lat:22.518968,lng:113.972602,accent:'#75efd3'},
 {id:'xiwang',name:'西湾红树林',short:'日落与潮沟秘境',distance:'24 km',limited:'弹涂鱼限定',species:['cormorant','avicennia','mudskipper','fish'],x:20,y:45,lat:22.59626,lng:113.83211,accent:'#ffbf73'},
 {id:'farm',name:'海上田园',short:'亲子湿地研学区',distance:'38 km',limited:'池鹭限定',species:['heron','avicennia','shell','fiddler'],x:14,y:28,lat:22.72819,lng:113.76665,accent:'#ffe071'},
 {id:'baguang',name:'坝光银叶树',short:'百年古树群落',distance:'56 km',limited:'银叶树守护卡',species:['heritiera','egret','shell'],x:76,y:43,lat:22.65986,lng:114.54395,accent:'#d9efe4'},
 {id:'dongchong',name:'东涌湿地',short:'山海交界原生湿地',distance:'72 km',limited:'桐花树限定',species:['aegiceras','fiddler','mudskipper'],x:86,y:67,lat:22.49256,lng:114.59048,accent:'#91d7ff'}
];
export const speciesFallbackImage=(item:Pick<Species,'id'|'no'>)=>{
 const index=Number(item.no.replace('SZ-',''));
 if(index>=21)return item.id==='mudskipper'||item.id==='fish'?'/species/mudfish.jpg':'/species/crab.jpg';
 if(index>=11)return '/species/mangrove.jpg';
 return index%2===0?'/species/bird-2.jpg':'/species/bird-1.jpg';
};
export const speciesLockedImage=(item:Pick<Species,'type'>)=>item.type==='鸟类'?'/species/locked-bird.svg':item.type==='树木'?'/species/locked-tree.svg':'/species/locked-mudflat.svg';
const localSpeciesImages:Record<string,string>=Object.fromEntries(['spoonbill','egret','heron','cormorant','kandelia','aegiceras','avicennia','heritiera','fiddler','mudskipper','shell','fish','grey-heron','avocet','stilt','gull','kingfisher','white-throat','excoecaria','bruguiera','acanthus','clerodendrum','hibiscus','pandanus','worm','snail','anemone','barnacle','starfish','jellyfish'].map(id=>[id,`/species/${id}.jpg`]));
const rarityOverrides:Record<string,Rarity>={
 spoonbill:'超稀有',egret:'常见',heron:'超稀有',cormorant:'超稀有','grey-heron':'超稀有',avocet:'超稀有',stilt:'超稀有',gull:'超稀有',kingfisher:'稀有','white-throat':'超稀有',
 kandelia:'常见',aegiceras:'稀有',avicennia:'稀有',heritiera:'超稀有',excoecaria:'稀有',bruguiera:'超稀有',acanthus:'常见',clerodendrum:'常见',hibiscus:'稀有',pandanus:'超稀有',
 fiddler:'常见',mudskipper:'稀有',shell:'常见',fish:'超稀有',worm:'常见',snail:'常见',anemone:'超稀有',barnacle:'常见',starfish:'超稀有',jellyfish:'稀有'
};
species.forEach(item=>{item.image=localSpeciesImages[item.id]??speciesFallbackImage(item);item.imageSource='深圳湿地观鸟与生态摄影资料整理 · 本地素材';item.rarity=rarityOverrides[item.id]??'稀有'});
export const getSpecies=(id:string)=>species.find(item=>item.id===id)!;
