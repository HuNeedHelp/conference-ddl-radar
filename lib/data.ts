import { load, JSON_SCHEMA } from 'js-yaml';
import catalog from '../data/ccf-catalog.json';
import aliases from '../data/source-aliases.json';
import { normalizeConferences, type Snapshot } from './conferences';

export const DATA_SOURCES = ['https://ccfddl.com/conference/allconf.yml', 'https://raw.githubusercontent.com/ccfddl/ccfddl.github.io/page/conference/allconf.yml'];
let cached: Snapshot | undefined;
let pending: Promise<Snapshot> | undefined;

export async function fetchSnapshot(force = false): Promise<Snapshot> {
  if (!force && cached && Date.now() - Date.parse(cached.fetchedAt) < 120_000) return cached;
  if (pending) return pending;
  pending = (async () => {
    for (const sourceUrl of DATA_SOURCES) {
      try {
        const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(8000), cache: 'no-store', headers: { Accept: 'text/plain', 'User-Agent': 'ConferenceDDLRadar/1.0' } });
        if (!res.ok) continue;
        const raw = load(await res.text(), { schema: JSON_SCHEMA });
        if (!Array.isArray(raw) || raw.length < 50) continue;
        const conferences = normalizeConferences(raw, catalog.conferences, aliases);
        if (conferences.filter(c => c.editions.length).length < 40) continue;
        cached = { fetchedAt: new Date().toISOString(), sourceUrl, sourceModified: res.headers.get('last-modified'), conferences, catalogVersion: catalog.version };
        return cached;
      } catch { /* try the independently hosted mirror */ }
    }
    throw new Error('数据源暂时无法访问，请稍后重试');
  })();
  try { return await pending; } finally { pending = undefined; }
}
