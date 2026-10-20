import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDeadline, normalizeConferences, submissionStatus, nextSubmission, focusEdition, countdown, safeUrl } from '../lib/conferences.ts';

test('AoE converts to next-day Beijing time without treating local calendar date as UTC', () => {
  assert.equal(parseDeadline('2026-11-10 23:59:59', 'UTC-12'), Date.parse('2026-11-11T11:59:59Z'));
  assert.equal(parseDeadline('2026-11-10 23:59:59', 'AoE'), Date.parse('2026-11-11T19:59:59+08:00'));
});
test('explicit fixed offsets include half-hour timezones', () => {
  assert.equal(parseDeadline('2026-10-20 15:00:00', 'UTC+5:30'), Date.parse('2026-10-20T09:30:00Z'));
});
test('PT observes daylight savings; PST remains a fixed offset', () => {
  assert.equal(parseDeadline('2026-07-01 12:00:00', 'PT'), Date.parse('2026-07-01T19:00:00Z'));
  assert.equal(parseDeadline('2026-12-01 12:00:00', 'PT'), Date.parse('2026-12-01T20:00:00Z'));
  assert.equal(parseDeadline('2026-07-01 12:00:00', 'PST'), Date.parse('2026-07-01T20:00:00Z'));
});
test('unknown times, invalid dates and missing zones never become invented precise deadlines', () => {
  for (const [date, zone] of [['TBD','AoE'],['2026-11-10','AoE'],['2026-11-10 12:00:00',''],['2026-02-30 12:00:00','UTC'],['2026-11-10 25:00:00','UTC'],['2026-11-10 12:00:00','Unknown']]) assert.equal(parseDeadline(date, zone), null);
});
const catalog = [{ acronym: 'FSE', name: 'Software Engineering', area: 'SE', rank: 'A', tags: [], sourcePage: 27 }];
test('same acronym in different areas cannot attach unrelated dates or ranks', () => {
  const result = normalizeConferences([{title:'FSE',sub:'SC',rank:{ccf:'B'},confs:[{year:2027,id:'encryption'}]},{title:'FSE',sub:'SE',rank:{ccf:'C'},confs:[{year:2027,id:'software'}]}], catalog, {FSE:'FSE'});
  assert.equal(result[0].rank,'A'); assert.equal(result[0].editions[0].id,'software');
});
const now = Date.parse('2026-10-20T00:00:00Z');
const node = (kind, at, round=1) => ({ id: `${kind}-${round}`,kind,at,round,label:kind,comment:'',original:'fixture' });
const edition = nodes => ({id:'fixture',year:2027,nodes,timezone:'UTC',url:'',place:'',date:''});
test('paper deadline after closed abstract registration is not offered as open to new authors', () => {
  const e=edition([node('abstract',now-1000),node('paper',now+100000)]);
  assert.equal(submissionStatus(e,now),'registered'); assert.equal(nextSubmission(e,now).kind,'paper');
});
test('open later rounds remain open despite a closed earlier round', () => {
  const e=edition([node('abstract',now-1000),node('paper',now-500),node('abstract',now+1000,2),node('paper',now+10000,2)]);
  assert.equal(submissionStatus(e,now),'open'); assert.equal(nextSubmission(e,now).round,2);
});
test('unknown abstract dates do not claim an open submission window', () => assert.equal(submissionStatus(edition([node('abstract',null),node('paper',now+1000)]),now),'unknown'));
test('notification and conference dates never count as next submission opportunities', () => {
  const e=edition([node('paper',now-1000),node('notification',now+100000)]);
  assert.equal(nextSubmission(e,now),undefined); assert.equal(submissionStatus(e,now),'closed');
});
test('focus picks upcoming edition before a newer edition with unknown dates', () => {
  const older={...edition([node('paper',now+1000)]),id:'upcoming',year:2027};
  const newer={...edition([node('paper',null)]),id:'unknown',year:2028};
  assert.equal(focusEdition({...catalog[0],editions:[newer,older]},now).id,'upcoming');
});
test('expired countdowns clamp at zero', () => { const result=countdown(now-1000,now); assert.equal(result.expired,true); assert.equal(result.days,0); assert.equal(result.seconds,'00'); });
test('source links reject script URLs', () => { assert.equal(safeUrl('javascript:alert(1)'),''); assert.equal(safeUrl('https://example.com'),'https://example.com/'); });
test('bundled source snapshot covers all official catalog entries and preserves exact CVPR time', () => {
  const x=JSON.parse(readFileSync(new URL('../data/seed.json',import.meta.url)));
  assert.equal(x.conferences.length,60); assert.equal(x.conferences.filter(c=>c.rank==='A').length,58);
  assert.ok(x.conferences.every(c=>c.sourceTitle && c.editions.length));
  const cvpr=x.conferences.find(c=>c.acronym==='CVPR').editions.find(e=>e.year===2027);
  assert.equal(cvpr.nodes.find(n=>n.kind==='abstract').at, Date.parse('2026-11-11T11:59:59Z'));
  const fse=x.conferences.find(c=>c.acronym==='FSE'); assert.equal(fse.area,'SE'); assert.match(fse.name,/Software Engineering/);
});
