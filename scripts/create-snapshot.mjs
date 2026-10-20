import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { load, JSON_SCHEMA } from 'js-yaml';
import { normalizeConferences } from '../lib/conferences.ts';
const catalog = JSON.parse(readFileSync(new URL('../data/ccf-catalog.json', import.meta.url)));
const aliases = JSON.parse(readFileSync(new URL('../data/source-aliases.json', import.meta.url)));
const raw = load(readFileSync(new URL('../work/allconf.yml', import.meta.url), 'utf8'), { schema: JSON_SCHEMA });
// Keep the downloaded file's timestamp: rebuilding an old snapshot is not a fresh fetch.
const fetchedAt = statSync(new URL('../work/allconf.yml', import.meta.url)).mtime.toISOString();
const snapshot = { fetchedAt, sourceUrl: 'https://ccfddl.com/conference/allconf.yml', sourceModified: null, catalogVersion: catalog.version, conferences: normalizeConferences(raw, catalog.conferences, aliases) };
writeFileSync(new URL('../data/seed.json', import.meta.url), JSON.stringify(snapshot));
console.log(JSON.stringify({ series: snapshot.conferences.length, withDates: snapshot.conferences.filter(c => c.editions.length).length, fetchedAt: snapshot.fetchedAt }));
