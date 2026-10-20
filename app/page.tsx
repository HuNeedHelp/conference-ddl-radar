'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, Database, Globe2, LayoutGrid, MapPin, Radar, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Star, X } from 'lucide-react';
import seedJson from '../data/seed.json';
import { AREAS, beijingTime, countdown, focusEdition, nextSubmission, submissionStatus, type Conference, type Edition, type Snapshot, type TimeNode } from '../lib/conferences';

const seed = seedJson as Snapshot;
const FAVORITES_KEY = 'ddl-radar-favorites-v1';
const CACHE_KEY = 'ddl-radar-data-v1';
const statuses = { open: '开放投稿', registered: '需已注册摘要', closed: '本届已截止', unknown: '时间待确认' };
const pad = (n: number) => String(n).padStart(2, '0');

function Countdown({ at, now, large = false }: { at?: number | null; now: number | null; large?: boolean }) {
  const value = now === null ? null : countdown(at, now);
  if (!value) return <span className="countdown-placeholder">{at == null ? '待公布' : '计算中…'}</span>;
  if (value.expired) return <span className="countdown-placeholder">已截止</span>;
  return <span className={large ? 'countdown countdown-large' : 'countdown'} aria-label={`剩余${value.days}天${value.hours}小时${value.minutes}分${value.seconds}秒`}>
    <strong>{value.days}</strong><span className="day-unit">天</span><span className="time-part">{value.hours}<i>:</i>{value.minutes}<i>:</i>{value.seconds}</span>
  </span>;
}

function Timeline({ edition, now }: { edition: Edition; now: number }) {
  const ordered = [...edition.nodes].sort((a, b) => (a.at ?? Infinity) - (b.at ?? Infinity));
  const rounds = Math.max(1, ...ordered.map(n => n.round));
  return <div className="timeline">
    {ordered.length === 0 && <p className="muted">暂未收录本届投稿节点，请查看会议官网。</p>}
    {ordered.map(n => <div className={`timeline-node ${n.at !== null && n.at <= now ? 'past' : ''}`} key={n.id}>
      <span className="timeline-dot" />
      <div className="node-body"><div className="node-heading"><strong>{n.label}{rounds > 1 && <small>第 {n.round} 轮</small>}</strong><span>{n.at !== null && n.at <= now ? '已过' : n.at !== null ? '即将到来' : '待确认'}</span></div>
        <p className="node-time">{beijingTime(n.at)}<span>北京时间</span></p>
        <p className="node-original">{n.original} {edition.timezone}{n.at === null && ' · 暂不生成倒计时'}</p>
        {n.comment && <p className="node-comment">{n.comment}</p>}
      </div>
    </div>)}
    <div className="event-summary"><CalendarDays size={15} /><div><strong>会议举办时间</strong><p>{!edition.date || /^(TBD|TBA)$/i.test(edition.date) ? '尚未公布' : edition.date}</p></div></div>
  </div>;
}

function ConferenceCard({ conference: c, now, saved, onSave }: { conference: Conference; now: number | null; saved: boolean; onSave: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editionId, setEditionId] = useState('');
  const clock = now ?? Date.parse(seed.fetchedAt);
  const focus = focusEdition(c, clock);
  const edition = c.editions.find(e => e.id === editionId) || focus;
  const node = nextSubmission(focus, clock);
  const status = submissionStatus(focus, clock);
  const soon = node?.at != null && node.at - clock < 14 * 86400_000;
  const paper = focus?.nodes.find(n => n.kind === 'paper');
  return <article className={`conference-card ${soon ? 'card-soon' : ''}`}>
    <div className="card-heading"><div className="conference-identity"><div className={`conference-mark ${c.tags.includes('robotics') ? 'robot-mark' : ''}`}>{c.acronym.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()}</div><div><h3 title={c.name}>{c.acronym} <span>{focus?.year || ''}</span></h3><div className="card-badges"><span className={`rank rank-${c.rank.toLowerCase()}`}>CCF {c.rank}</span><span>{c.tags.includes('vision') ? '计算机视觉' : c.tags.includes('robotics') ? '机器人' : AREAS[c.area]}</span></div></div></div>
      <button className={`icon-button favorite-button ${saved ? 'is-saved' : ''}`} onClick={onSave} aria-label={`${saved ? '取消收藏' : '收藏'} ${c.acronym}`} aria-pressed={saved} title={saved ? '取消收藏' : '收藏会议'}><Star size={19} fill={saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="deadline-panel"><div className="deadline-caption"><span className={`status-dot ${status}`} />{node ? `距离${node.label}` : statuses[status]}{node && node.round > 1 && <span className="round-tag">第{node.round}轮</span>}</div>
      {node ? <><Countdown at={node.at} now={now} /><div className="deadline-date">{beijingTime(node.at)} <span>北京时间</span></div></> : <><div className="no-deadline">{status === 'closed' ? '等待下一次投稿机会' : '正式日期尚待确认'}</div><div className="deadline-date">{status === 'closed' && paper ? `本届全文 ${beijingTime(paper.at)}` : '以会议官网公布为准'}</div></>}
    </div>
    {status === 'registered' && <p className="abstract-caution">摘要注册已截止，仅此前完成注册者可继续投稿；请核对官网要求。</p>}
    <div className="mini-nodes">{['abstract', 'paper'].map(kind => { const n = focus?.nodes.filter(n => n.kind === kind).find(n => n.at !== null && n.at > clock) || focus?.nodes.find(n => n.kind === kind); return <div key={kind}><span>{kind === 'abstract' ? '摘要' : '全文'}</span><strong>{n?.at == null ? '待确认' : beijingTime(n.at).slice(5, 11)}</strong></div>; })}<div><span>状态</span><strong className={`state-label ${status}`}>{statuses[status]}</strong></div></div>
    <div className="card-footer"><button className="text-button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={`timeline-${c.acronym.replace(/\W/g, '')}`}><CalendarDays size={14} />重要时间节点 <ChevronDown size={14} className={expanded ? 'rotate' : ''} /></button>{focus?.url ? <a href={focus.url} target="_blank" rel="noopener noreferrer">会议官网<ArrowUpRight size={14} /></a> : <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">数据来源<ArrowUpRight size={14} /></a>}</div>
    {expanded && edition && <section className="expanded-timeline" id={`timeline-${c.acronym.replace(/\W/g, '')}`} aria-label={`${c.acronym}重要时间节点`}>
      <p className="conference-description">{c.name}</p>
      <div className="timeline-toolbar"><label>查看届次<select value={edition.id} onChange={e => setEditionId(e.target.value)}>{c.editions.map(e => <option key={e.id} value={e.id}>{e.year} · {e.id}</option>)}</select></label><span>原时区 {edition.timezone || '待确认'}</span></div>
      <p className="edition-location"><MapPin size={12} />{!edition.place || /^(TBD|TBA)$/i.test(edition.place) ? '地点待公布' : edition.place}</p>
      <Timeline edition={edition} now={clock} /><div className="timeline-source"><span>时间来自 CCF-Deadlines 聚合记录</span><a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">核对源记录<ArrowUpRight size={12} /></a></div>
    </section>}
  </article>;
}

export default function Home() {
  const [data, setData] = useState<Snapshot>(seed);
  const [now, setNow] = useState<number | null>(null);
  const [view, setView] = useState('all');
  const [direction, setDirection] = useState('focus');
  const [rank, setRank] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('deadline');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  const [refreshState, setRefreshState] = useState('seed');
  const [storageError, setStorageError] = useState(false);
  const sourceDialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const lastRefresh = useRef(0);

  const refresh = useCallback(async (manual = false) => {
    if (inFlight.current) return;
    inFlight.current = true; setRefreshing(true);
    try {
      const response = await fetch(`/api/conferences${manual ? '?refresh=1' : ''}`, { cache: 'no-store', signal: AbortSignal.timeout(22000) });
      if (!response.ok) throw new Error('refresh failed');
      const fresh: Snapshot = await response.json();
      if (!Array.isArray(fresh.conferences) || fresh.conferences.length !== seed.conferences.length || !Number.isFinite(Date.parse(fresh.fetchedAt))) throw new Error('invalid data');
      setData(fresh); setRefreshState('live'); lastRefresh.current = Date.now();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch { /* data stays available in memory */ }
    } catch { setRefreshState('error'); }
    finally { inFlight.current = false; setRefreshing(false); }
  }, []);

  useEffect(() => {
    setNow(Date.now());
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      if (Array.isArray(saved)) setFavorites(saved.filter((x: unknown): x is string => typeof x === 'string' && seed.conferences.some(c => c.acronym === x)));
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.catalogVersion === seed.catalogVersion && cached.conferences?.length === seed.conferences.length && cached.conferences.every((c: any) => typeof c.acronym === 'string' && Array.isArray(c.editions)) && Date.parse(cached.fetchedAt) > Date.parse(seed.fetchedAt)) { setData(cached); setRefreshState('cache'); }
    } catch { /* use bundled snapshot if browser cache is unavailable */ }
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 1000);
    const resume = () => { if (!document.hidden) { setNow(Date.now()); if (Date.now() - lastRefresh.current > 120_000) void refresh(); } };
    document.addEventListener('visibilitychange', resume);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', resume); };
  }, [refresh]);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); }
  };
  const clock = now ?? Date.parse(seed.fetchedAt);
  const conferences = useMemo(() => data.conferences.filter(c => {
    if (view === 'favorites' && !favorites.includes(c.acronym)) return false;
    if (direction === 'focus' && !c.tags.some(t => ['vision', 'robotics'].includes(t))) return false;
    if (direction === 'vision' && !c.tags.includes('vision')) return false;
    if (direction === 'robotics' && !c.tags.includes('robotics')) return false;
    if (direction !== 'all' && !['focus', 'vision', 'robotics'].includes(direction) && c.area !== direction) return false;
    if (rank !== 'all' && c.rank !== rank) return false;
    const e = focusEdition(c, clock); const s = submissionStatus(e, clock); const next = nextSubmission(e, clock);
    if (status === 'soon' && (!next?.at || next.at - clock > 30 * 86400_000)) return false;
    if (!['all', 'soon'].includes(status) && s !== status) return false;
    const text = `${c.acronym} ${c.name} ${AREAS[c.area]} ${c.tags.includes('vision') ? '视觉' : ''} ${c.tags.includes('robotics') ? '机器人' : ''} ${e?.year || ''} ${e?.place || ''}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  }).sort((a, b) => {
    if (sort === 'name') return a.acronym.localeCompare(b.acronym);
    if (sort === 'rank' && a.rank !== b.rank) return a.rank.localeCompare(b.rank);
    return (nextSubmission(focusEdition(a, clock), clock)?.at ?? Infinity) - (nextSubmission(focusEdition(b, clock), clock)?.at ?? Infinity) || a.acronym.localeCompare(b.acronym);
  }), [data, view, favorites, direction, rank, status, search, sort, clock]);

  const featured = [...conferences].filter(c => nextSubmission(focusEdition(c, clock), clock)).sort((a, b) => nextSubmission(focusEdition(a, clock), clock)!.at! - nextSubmission(focusEdition(b, clock), clock)!.at!)[0];
  const featureEdition = featured && focusEdition(featured, clock);
  const featureNode = nextSubmission(featureEdition, clock);
  const upcoming = data.conferences.filter(c => submissionStatus(focusEdition(c, clock), clock) === 'open').length;
  const closeCount = data.conferences.filter(c => { const n = nextSubmission(focusEdition(c, clock), clock); return n?.at != null && n.at - clock < 30 * 86400_000; }).length;
  const clearFilters = () => { setSearch(''); setRank('all'); setStatus('all'); setDirection('all'); setSort('deadline'); };

  return <div className="app-shell">
    <header className="app-header"><div className="header-inner">
      <a className="brand" href="/" aria-label="DDL Radar 首页"><span className="brand-icon"><Radar size={23} /></span><span>DDL <b>Radar</b></span></a>
      <nav className="main-nav" aria-label="会议视图"><button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}><LayoutGrid size={16} />会议看板<span>{data.conferences.length}</span></button><button className={view === 'favorites' ? 'active' : ''} onClick={() => setView('favorites')}><Star size={16} />我的收藏<span>{favorites.length}</span></button></nav>
      <div className="header-tools"><span className="header-catalog"><ShieldCheck size={14} />CCF 2026</span><div className="timezone-indicator"><Globe2 size={14} />北京时间 <span>UTC+8</span></div><button className="header-source" onClick={() => sourceDialog.current?.showModal()} aria-label="数据与使用说明"><Database size={15} /><span>数据说明</span></button></div>
    </div></header>
    <div className="main-shell">
      <main className="main-content">
        <div className="dashboard-heading"><h1>{view === 'all' ? '会议投稿看板' : '我的会议收藏'}</h1><div className="summary-inline" aria-label="全部方向会议统计"><span><b>58</b> 个 A 会</span><span><b>2</b> 个精选 B 会</span><span><b>{pad(upcoming)}</b> 场开放投稿</span><span className="summary-urgent"><b>{pad(closeCount)}</b> 场 30 天内截止</span></div><button className="refresh-button" onClick={() => void refresh(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'spin' : ''} />{refreshing ? '正在更新' : '刷新数据'}</button></div>
        {featured && featureEdition && featureNode && <section className="next-deadline" aria-label="当前列表最近截止节点"><div className="next-info"><span className="next-label"><span className="pulse-dot" />当前列表 · 最近投稿节点</span><div className="next-title">{featured.acronym} <span>{featureEdition.year}</span><span className={`rank rank-${featured.rank.toLowerCase()}`}>CCF {featured.rank}</span></div><p>{featureNode.label} · {beijingTime(featureNode.at)} 北京时间</p></div><div className="next-countdown"><span>距截止还有</span><Countdown at={featureNode.at} now={now} large /></div><div className="radar-decoration" aria-hidden="true"><span /><span /><span /></div></section>}
        <div className={`sync-status ${refreshState === 'error' ? 'sync-error' : ''}`} role="status"><span className={refreshing ? 'sync-dot updating' : 'sync-dot'} />{refreshing ? '正在获取最新聚合数据，倒计时正常运行' : refreshState === 'error' ? '更新未成功，当前为已有数据，可点击刷新重试' : refreshState === 'live' ? '已获取最新聚合数据' : '正在显示已保存的数据快照'}<span className="sync-timestamp">上次成功获取：{beijingTime(Date.parse(data.fetchedAt))}</span><button onClick={() => sourceDialog.current?.showModal()}>来源说明<ArrowUpRight size={12} /></button></div>
        {storageError && <p className="storage-error" role="alert">浏览器未允许本地存储，收藏当前仅在本次打开期间有效。</p>}
        <section className="conference-browser" aria-label="会议搜索和筛选">
          <div className="browser-heading"><h2>{view === 'favorites' ? '我的收藏' : '发现会议'}<span>{conferences.length}</span></h2><label className="search-box"><Search size={16} /><input aria-label="搜索会议" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索会议、关键词或地点…" />{search && <button onClick={() => setSearch('')} aria-label="清除搜索"><X size={14} /></button>}</label></div>
          <div className="filter-row"><div className="topic-tabs" aria-label="研究方向">{[['focus', '视觉与机器人'], ['all', '全部方向'], ['vision', '计算机视觉'], ['robotics', '机器人'], ['AI', '人工智能']].map(([key, label]) => <button key={key} className={direction === key ? 'selected' : ''} aria-pressed={direction === key} onClick={() => setDirection(key)}>{label}</button>)}</div><label className="other-directions"><span className="sr-only">其他研究方向</span><select value={Object.keys(AREAS).includes(direction) && direction !== 'AI' ? direction : ''} onChange={e => { if (e.target.value) setDirection(e.target.value); }}><option value="">其他方向</option>{Object.entries(AREAS).filter(([k]) => k !== 'AI').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
          <div className="filter-toolbar"><div className="filter-controls"><SlidersHorizontal size={14} /><label><span className="sr-only">CCF 等级</span><select value={rank} onChange={e => setRank(e.target.value)}><option value="all">全部等级</option><option value="A">CCF A</option><option value="B">CCF B</option></select></label><label><span className="sr-only">投稿状态</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">全部投稿状态</option><option value="open">开放投稿</option><option value="soon">30 天内截止</option><option value="registered">需已注册摘要</option><option value="closed">本届已截止</option><option value="unknown">时间待确认</option></select></label>{(search || rank !== 'all' || status !== 'all' || direction !== 'focus') && <button className="reset-button" onClick={clearFilters}>重置筛选</button>}</div><label className="sort-control"><ArrowDownUp size={13} /><select value={sort} onChange={e => setSort(e.target.value)} aria-label="会议排序"><option value="deadline">截止时间优先</option><option value="name">会议名称排序</option><option value="rank">CCF 等级优先</option></select></label></div>
        </section>
        {conferences.length ? <div className="conference-grid">{conferences.map(c => <ConferenceCard key={c.acronym} conference={c} now={now} saved={favorites.includes(c.acronym)} onSave={() => toggleFavorite(c.acronym)} />)}</div> : <div className="empty-state"><div>{view === 'favorites' ? <Star size={28} /> : <Search size={28} />}</div><h3>{view === 'favorites' && !favorites.length ? '还没有收藏的会议' : '暂时没有匹配的会议'}</h3><p>{view === 'favorites' && !favorites.length ? '点击会议卡片右上角的星标，把重点会议留在这里。' : '试试其他研究方向，或放宽等级与投稿状态筛选。'}</p><button onClick={() => { clearFilters(); setView('all'); }}>浏览所有会议<ArrowUpRight size={15} /></button></div>}
        <footer className="page-footer"><span><Radar size={14} />DDL Radar<span className="footer-divider">/</span>把握节点，专注研究。</span><button onClick={() => sourceDialog.current?.showModal()}>时间来自聚合记录 · 投稿前请核对官网<ArrowUpRight size={12} /></button></footer>
      </main>
    </div>
    <dialog ref={sourceDialog} className="source-dialog" onClick={e => { if (e.target === sourceDialog.current) sourceDialog.current?.close(); }}><div className="dialog-content"><div className="dialog-heading"><div><span className="eyebrow">DATA & NOTES</span><h2>数据与使用说明</h2></div><button className="icon-button" onClick={() => sourceDialog.current?.close()} aria-label="关闭说明"><X size={20} /></button></div><section><h3><ShieldCheck size={17} />会议分级</h3><p>依据 CCF 第七版（2026）正式目录：全部 58 个 A 类会议，以及精选 B 类会议 ECCV、ICRA。方向标签用于个人筛选，不是额外的官方分级。</p><a href="https://www.ccf.org.cn/Academic_Evaluation/By_category/" target="_blank" rel="noopener noreferrer">查看 CCF 官方目录<ArrowUpRight size={13} /></a></section><section><h3><Database size={17} />截止日期与更新</h3><p>来自 CCF-Deadlines 的公开聚合记录。打开页面时刷新，服务端最多复用 2 分钟内的数据；手动刷新会重新访问上游。上次成功获取时间表示读取聚合源的时间，不表示已经逐项核验官网。</p><p>聚合记录可能滞后，也可能含默认时区。日期以会议官网为准；未公布或无法确定时区的时间不生成精确倒计时。当前未提供官网变动即时同步保证。</p><a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">当前聚合数据源<ArrowUpRight size={13} /></a></section><section><h3><Clock3 size={17} />时间与投稿资格</h3><p>统一展示北京时间，同时保留原始时间和时区。AoE 为 UTC−12，比北京时间晚 20 小时。不同届次、不同轮次分别展示；摘要注册截止后，全文仍未截止不代表新作者仍可投稿。</p><p>页面优先突出最近的摘要或全文截止节点；没有下一届正式日期时，保留本届信息并标明已截止。结果通知和举办时间不会被算作投稿 DDL。</p></section><section><h3><Star size={17} />本设备收藏</h3><p>免登录。收藏仅存储在当前浏览器，清理网站数据或更换设备后不会自动恢复。页面不发送提醒，也不上传收藏记录。</p></section><button className="dialog-done" onClick={() => sourceDialog.current?.close()}><Check size={16} />了解了</button></div></dialog>
  </div>;
}
