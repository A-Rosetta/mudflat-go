import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import App from './App';
import {CollectionView} from './atlas';
import {CardReveal} from './collection';
import {makeScanResult,requestGpsCheck} from './capture-game';
import {getSpecies,species,wetlands} from './data';
import {TasksView} from './tasks';

describe('Mudflat Go demo flow',()=>{
  beforeEach(()=>localStorage.clear());

  it('shows six Shenzhen wetland locations',()=>{
    render(<App/>);
    expect(screen.getAllByTestId('map-location')).toHaveLength(6);
  });

  it('shows an ordered route and locks later landmarks',async()=>{
    const user=userEvent.setup();
    render(<App/>);
    expect(screen.getByTestId('wetland-route')).toBeInTheDocument();
    expect(screen.getAllByTestId('landmark-bubble')).toHaveLength(6);
    const locations=screen.getAllByTestId('map-location');
    expect(locations[0]).toHaveAttribute('aria-disabled','false');
    expect(locations[1]).toHaveAttribute('aria-disabled','false');
    expect(locations[2]).toHaveAttribute('aria-disabled','true');
    await user.click(locations[2]);
    expect(screen.getByTestId('map-enter-location')).toBeDisabled();
  });

  it('does not unlock route progress from unrelated atlas collection count',()=>{
    localStorage.setItem('mudflat-unlocked',JSON.stringify(['egret','fiddler','spoonbill','kandelia']));
    localStorage.setItem('mudflat-route-progress',JSON.stringify(2));
    render(<App/>);
    const locations=screen.getAllByTestId('map-location');
    expect(locations[0]).toHaveAttribute('aria-disabled','false');
    expect(locations[1]).toHaveAttribute('aria-disabled','false');
    expect(locations[2]).toHaveAttribute('aria-disabled','true');
  });

  it('opens a location and starts a target capture',async()=>{
    const user=userEvent.setup();
    render(<App/>);
    await user.click(screen.getByRole('button',{name:'进入福田红树林'}));
    expect(screen.getByText('这里可能遇见它们')).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:/锁定黑脸琵鹭/}));
    expect(screen.getByRole('button',{name:'开始生态捕捉'})).toBeInTheDocument();
  });

  it('moves the map focus when choosing another wetland',async()=>{
    const user=userEvent.setup();
    render(<App/>);
    await user.click(screen.getAllByRole('button',{name:/定位到深圳湾公园/})[0]);
    expect(screen.getByRole('button',{name:'进入深圳湾公园'})).toBeInTheDocument();
  });

  it('offers a thirty-card atlas, daily supply and no non-P0 surfaces',async()=>{
    const user=userEvent.setup();
    const {container}=render(<App/>);
    expect(screen.queryByText('深圳榜 #12')).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'设定'})).not.toBeInTheDocument();
    expect(container.querySelector('.capture-shortcut')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'图鉴'}));
    expect(screen.getAllByTestId('collection-card')).toHaveLength(30);
    expect(screen.queryByRole('button',{name:'成就'})).not.toBeInTheDocument();
    expect(screen.getByTestId('atlas-progress')).toHaveTextContent('2/30');
    await user.click(screen.getByTestId('daily-supply'));
    expect(screen.getByTestId('atlas-progress')).toHaveTextContent('2/30');
    expect(screen.getByText('1,400')).toBeInTheDocument();
  });

  it('shows a polished profile page from bottom navigation',async()=>{
    const user=userEvent.setup();
    render(<App/>);
    await user.click(screen.getByRole('button',{name:'我的'}));
    expect(screen.getByText('我的湿地手册')).toBeInTheDocument();
    expect(screen.getByText('深圳湿地探索者')).toBeInTheDocument();
    expect(screen.getByText('继续探索路线')).toBeInTheDocument();
  });

  it('does not allow direct collecting from atlas card details',async()=>{
    const user=userEvent.setup();
    render(<App/>);
    await user.click(screen.getByRole('button',{name:'图鉴'}));
    await user.click(screen.getAllByTestId('collection-card')[0]);
    expect(screen.queryByTestId('collect-card-action')).not.toBeInTheDocument();
  });

  it('does not open locked atlas details or share locked cards',async()=>{
    const user=userEvent.setup();
    render(<CollectionView unlocked={[]} levels={{}} score={0} giftClaimed={false} onSelect={vi.fn()} onClaimGift={vi.fn()}/>);
    await user.click(screen.getAllByTestId('collection-card')[0]);
    expect(screen.queryByRole('button',{name:'翻转生态卡片'})).not.toBeInTheDocument();
    render(<CardReveal item={species[0]} level={0} flipped={false} onFlip={vi.fn()} onClose={vi.fn()} onCollect={vi.fn()} collected={false} canCollect={false}/>);
    expect(screen.queryByTestId('share-card-action')).not.toBeInTheDocument();
  });

  it('uses a local atlas image when the remote species image fails',()=>{
    render(<CollectionView unlocked={['spoonbill']} levels={{spoonbill:2}} score={0} giftClaimed={false} onSelect={vi.fn()} onClaimGift={vi.fn()}/>);
    const image=screen.getAllByTestId('collection-card')[0].querySelector('img')!;
    fireEvent.error(image);
    expect(image.getAttribute('src')).toBe('/species/bird-1.jpg');
  });

  it('shows locked atlas names, info and silhouette images',()=>{
    render(<CollectionView unlocked={[]} levels={{}} score={0} giftClaimed={false} onSelect={vi.fn()} onClaimGift={vi.fn()}/>);
    const first=screen.getAllByTestId('collection-card')[0];
    expect(screen.getByText('黑脸琵鹭')).toBeInTheDocument();
    expect(screen.getByText('全球珍稀的“黑面舞者”')).toBeInTheDocument();
    expect(screen.queryByText('鸟类轮廓')).not.toBeInTheDocument();
    expect(first.querySelector('img')?.getAttribute('src')).toBe('/species/locked-bird.svg');
  });

  it('uses only three visible rarity levels after data normalization',()=>{
    expect(new Set(species.map(item=>item.rarity))).toEqual(new Set(['常见','稀有','超稀有']));
    render(<CollectionView unlocked={[]} levels={{}} score={0} giftClaimed={false} onSelect={vi.fn()} onClaimGift={vi.fn()}/>);
    expect([...screen.getByLabelText('稀有度筛选').querySelectorAll('option')].map(option=>option.textContent)).toEqual(['全部','常见','稀有','超稀有']);
  });

  it('shows card levels and can generate a share card',async()=>{
    const user=userEvent.setup();
    render(<CollectionView unlocked={['spoonbill']} levels={{spoonbill:3}} score={0} giftClaimed={false} onSelect={vi.fn()} onClaimGift={vi.fn()}/>);
    expect(screen.getByTestId('card-level-spoonbill')).toHaveTextContent('Lv.3');
    render(<CardReveal item={species[0]} level={3} flipped={false} onFlip={vi.fn()} onClose={vi.fn()} onCollect={vi.fn()} collected canCollect={false}/>);
    await user.click(screen.getByTestId('share-card-action'));
    expect(screen.getByTestId('share-card')).toHaveTextContent('黑脸琵鹭');
    expect(screen.getByTestId('share-card')).toHaveTextContent('Lv.3');
  });

  it('still shows GPS tasks when location cannot be identified',async()=>{
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:vi.fn((_:unknown,error:(reason?:unknown)=>void)=>error(new Error('blocked')))}});
    const {container}=render(<TasksView onOpen={vi.fn()}/>);
    await waitFor(()=>expect(screen.getAllByText('无法识别位置').length).toBeGreaterThan(0));
    expect(container.querySelectorAll('.task-card')).toHaveLength(6);
    expect(screen.getAllByText('位置未知')).toHaveLength(6);
  });

  it('keeps task board aligned with route unlock order',async()=>{
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:vi.fn((_:unknown,error:(reason?:unknown)=>void)=>error(new Error('blocked')))}});
    render(<TasksView unlockedLocationCount={2} onOpen={vi.fn()}/>);
    await waitFor(()=>expect(screen.getAllByTestId('task-card')).toHaveLength(6));
    const actions=screen.getAllByTestId('task-open');
    expect(actions[0]).not.toBeDisabled();
    expect(actions[1]).not.toBeDisabled();
    expect(actions[2]).toBeDisabled();
  });

  it('produces varied pseudo-random scan species and categories',()=>{
    const results=Array.from({length:24},(_,index)=>makeScanResult(species[0],`seed-${index}`));
    expect(new Set(results.map(result=>result.item.id)).size).toBeGreaterThan(1);
    expect(new Set(results.map(result=>result.category)).size).toBeGreaterThan(1);
  });

  it('keeps point-target scans inside the selected species type',()=>{
    const futianCandidates=wetlands[0].species.map(getSpecies);
    const results=Array.from({length:24},(_,index)=>makeScanResult(species[0],`seed-${index}`,futianCandidates));
    expect(results.every(result=>result.category==='鸟类')).toBe(true);
    expect(new Set(results.map(result=>result.item.id)).size).toBeGreaterThan(1);
  });

  it('reports GPS as unverified when location permission fails',async()=>{
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:vi.fn((_:unknown,error:(reason?:unknown)=>void)=>error(new Error('blocked')))}});
    await expect(requestGpsCheck()).resolves.toMatchObject({verified:false,label:'GPS 未校验'});
  });

  it('labels captured existing cards as level upgrades',()=>{
    render(<CardReveal item={species[1]} level={2} flipped={false} onFlip={vi.fn()} onClose={vi.fn()} onCollect={vi.fn()} collected canCollect/>);
    expect(screen.getByTestId('collect-card-action')).toHaveTextContent('提升卡片等级');
  });

  it('requests the real rear camera before capture',async()=>{
    const user=userEvent.setup();
    const getUserMedia=vi.fn().mockResolvedValue({getTracks:()=>[{stop:vi.fn()}]});
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia}});
    render(<App/>);
    await user.click(screen.getByRole('button',{name:'进入福田红树林'}));
    await user.click(screen.getByRole('button',{name:/锁定黑脸琵鹭/}));
    await user.click(screen.getByRole('button',{name:'开始生态捕捉'}));
    await user.click(screen.getByRole('button',{name:'启动真实相机'}));
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({video:expect.objectContaining({facingMode:expect.anything()})}));
    expect(screen.getByRole('button',{name:'拍照识别'})).toBeInTheDocument();
  });

  it('exits capture immediately when camera permission is denied',async()=>{
    const user=userEvent.setup();
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:vi.fn().mockRejectedValue(new DOMException('Denied','NotAllowedError'))}});
    render(<App/>);
    await user.click(screen.getByRole('button',{name:'进入福田红树林'}));
    await user.click(screen.getByRole('button',{name:/锁定黑脸琵鹭/}));
    await user.click(screen.getByRole('button',{name:'开始生态捕捉'}));
    await user.click(screen.getByRole('button',{name:'启动真实相机'}));
    await waitFor(()=>expect(screen.getByRole('button',{name:'开始生态捕捉'})).toBeInTheDocument());
    expect(screen.queryByText(/演示镜头|降级模式/)).not.toBeInTheDocument();
  });
});
