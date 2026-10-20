export type CatalogEntry = { acronym: string; name: string; rank: string; area: string; tags: string[]; sourcePage: number };
export type TimeNode = { id: string; kind: string; label: string; original: string; at: number | null; round: number; comment: string };
export type Edition = { id: string; year: number; url: string; timezone: string; date: string; place: string; nodes: TimeNode[] };
export type Conference = CatalogEntry & { editions: Edition[]; sourceTitle: string; sourceUrl: string };
export type Snapshot = { fetchedAt: string; sourceUrl: string; sourceModified: string | null; conferences: Conference[]; catalogVersion: string };

export const AREAS: Record<string, string> = { DS: '体系结构与分布计算', NW: '计算机网络', SC: '网络与信息安全', SE: '软件工程与程序语言', DB: '数据库与数据挖掘', CT: '计算理论', CG: '图形学与多媒体', AI: '人工智能', HI: '人机交互', MX: '交叉与新兴领域' };
export const NODE_FIELDS: Record<string, [string, string]> = {
  abstract_deadline: ['abstract', '摘要注册'], deadline: ['paper', '全文提交'],
  paper_deadline: ['paper', '全文提交'], supplementary_deadline: ['supplement', '补充材料'],
  supplement_deadline: ['supplement', '补充材料'], rebuttal_deadline: ['rebuttal', '作者回复'],
  decision_deadline: ['notification', '结果通知'], notification_deadline: ['notification', '结果通知'],
  registration_deadline: ['registration', '注册截止'],
};

/** An explicit time and a supported timezone are required. Never guess a TBD's instant. */
export function parseDeadline(value: unknown, zone: string): number | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m || !zone) return null;
  const [year, month, day, hour, minute, second] = m.slice(1).map(v => Number(v || 0));
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  const d = new Date(wall);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return null;
  const z = zone.trim();
  const fixed: Record<string, number> = { AoE: -720, AOE: -720, UTC: 0, GMT: 0, PST: -480, PDT: -420, EST: -300, EDT: -240, CET: 60, CEST: 120, JST: 540, KST: 540, HKT: 480 };
  let offset = fixed[z];
  const f = /^(?:UTC|GMT)([+-])(\d{1,2})(?::(\d{2}))?$/i.exec(z);
  if (f) {
    if (Number(f[2]) > 14 || Number(f[3] || 0) > 59) return null;
    offset = (f[1] === '-' ? -1 : 1) * (Number(f[2]) * 60 + Number(f[3] || 0));
  }
  if (offset !== undefined) return wall - offset * 60_000;
  const aliases: Record<string, string> = { PT: 'America/Los_Angeles', ET: 'America/New_York', CT: 'America/Chicago', MT: 'America/Denver' };
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: aliases[z] || z, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    let candidate = wall;
    for (let i = 0; i < 3; i++) {
      const p = Object.fromEntries(fmt.formatToParts(candidate).map(x => [x.type, x.value]));
      const represented = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
      const corrected = candidate + wall - represented;
      if (corrected === candidate) return corrected;
      candidate = corrected;
    }
    return null; // e.g. a wall time skipped by daylight saving
  } catch { return null; }
}

export function safeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export function normalizeConferences(raw: unknown, catalog: CatalogEntry[], aliases: Record<string, string>): Conference[] {
  if (!Array.isArray(raw)) throw new Error('会议数据格式不正确');
  return catalog.map(c => {
    // FSE has two unrelated meanings; title AND subject are required to join.
    const s = raw.find(s => s && s.title === (aliases[c.acronym] || c.acronym) && s.sub === c.area);
    const editions = (Array.isArray(s?.confs) ? s.confs : []).map((e: any, ei: number): Edition => {
      const zone = typeof e.timezone === 'string' ? e.timezone : '';
      const timeline = Array.isArray(e.timeline) ? e.timeline : [];
      const nodes: TimeNode[] = timeline.flatMap((t: any, ri: number) => Object.entries(NODE_FIELDS).filter(([field]) => t[field] != null).map(([field, [kind, label]]) => ({
        id: `${ei}-${ri}-${field}`, kind, label, original: String(t[field]), at: parseDeadline(t[field], zone), round: ri + 1, comment: typeof t.comment === 'string' ? t.comment : '',
      })));
      return { id: String(e.id || `${c.acronym}-${e.year}-${ei}`), year: Number(e.year), url: safeUrl(e.link), timezone: zone, date: String(e.date || ''), place: String(e.place || ''), nodes };
    }).filter((e: Edition) => Number.isFinite(e.year)).sort((a: Edition, b: Edition) => b.year - a.year || a.id.localeCompare(b.id));
    return { ...c, editions, sourceTitle: s?.title || '', sourceUrl: `https://github.com/ccfddl/ccf-deadlines/tree/main/conference/${c.area}` };
  });
}

export const submissionNodes = (e: Edition) => e.nodes.filter(n => ['abstract', 'paper'].includes(n.kind));

export function focusEdition(c: Conference, now: number): Edition | undefined {
  const future = c.editions.filter(e => submissionNodes(e).some(n => n.at !== null && n.at > now));
  return future.sort((a, b) => Math.min(...submissionNodes(a).filter(n => n.at !== null && n.at > now).map(n => n.at!)) - Math.min(...submissionNodes(b).filter(n => n.at !== null && n.at > now).map(n => n.at!)))[0] || c.editions[0];
}

export function nextSubmission(e: Edition | undefined, now: number): TimeNode | undefined {
  return e?.nodes.filter(n => ['abstract', 'paper'].includes(n.kind) && n.at !== null && n.at > now).sort((a, b) => a.at! - b.at!)[0];
}

export function submissionStatus(e: Edition | undefined, now: number): 'open' | 'registered' | 'closed' | 'unknown' {
  if (!e) return 'unknown';
  const papers = e.nodes.filter(n => n.kind === 'paper');
  const future = papers.filter(n => n.at !== null && n.at > now);
  if (future.length) {
    const openRound = future.some(p => {
      const abstracts = e.nodes.filter(a => a.kind === 'abstract' && a.round === p.round);
      return !abstracts.length || abstracts.every(a => a.at !== null && a.at > now);
    });
    if (openRound) return 'open';
    return future.some(p => e.nodes.some(a => a.kind === 'abstract' && a.round === p.round && a.at === null)) ? 'unknown' : 'registered';
  }
  if (papers.some(n => n.at === null) || !papers.length) return 'unknown';
  return 'closed';
}

export function countdown(at: number | null | undefined, now: number) {
  if (at == null) return null;
  const seconds = Math.max(0, Math.floor((at - now) / 1000));
  return { expired: at <= now, days: Math.floor(seconds / 86400), hours: String(Math.floor(seconds / 3600) % 24).padStart(2, '0'), minutes: String(Math.floor(seconds / 60) % 60).padStart(2, '0'), seconds: String(seconds % 60).padStart(2, '0') };
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const beijingTime = (at: number | null | undefined) => at == null ? '时间待确认' : dateFormatter.format(at).replaceAll('/', '.');
