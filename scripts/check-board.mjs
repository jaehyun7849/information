import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resetEvaluationState,runFixture,kstDate} from '../lib/board-engine.mjs';
const load=n=>JSON.parse(readFileSync(new URL('../public/assets/t04/fixtures/'+n+'.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../public/assets/t04/asset-manifest.json',import.meta.url)));
for(const f of manifest.files){const b=readFileSync(new URL('../public/assets/t04/'+f.path,import.meta.url));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
let s=resetEvaluationState();s=runFixture(s,load('normal-d1-a'));const id=s.daily_readings[0].record_id;s=runFixture(s,load('normal-d1-b'));assert.equal(s.daily_readings.length,1);assert.equal(s.daily_readings[0].record_id,id);assert.equal(s.current_reading.normalized_value,105);const base=s;
s=runFixture(s,load('normal-d2'));assert.equal(s.daily_readings.length,2);assert.equal(s.last_delta,15);assert.equal(s.last_comparison.direction,'increase');
for(const [name,code] of [['timeout','timeout'],['auth-401','auth'],['rate-429','rate_limit'],['offline','offline'],['schema-break','schema_error']]){let failed=runFixture(base,load(name));assert.deepEqual(failed.daily_readings,base.daily_readings);assert.deepEqual(failed.current_reading,base.current_reading);assert.equal(failed.status.freshness,'stale');assert.equal(failed.status.error_code,code);const good=runFixture(failed,load('recover-d2'));assert.deepEqual(good.status,{freshness:'fresh',error_code:'none'});assert.equal(good.daily_readings.length,2);assert.equal(good.current_reading.normalized_value,120);assert.equal(good.last_delta,15);assert.equal(runFixture(good,load('recover-d2')).daily_readings.length,2);}
assert.equal(kstDate('2026-10-07T14:59:59Z'),'2026-10-07');assert.equal(kstDate('2026-10-07T15:00:00Z'),'2026-10-08');assert.equal(base.current_reading.normalized_value,105);
console.log('PASS: 17 official asset hashes; same-day stable ID; next-day insertion; five failures and recovery; retry idempotency; KST midnight.');

const {normalizeMET}=await import('../lib/normalize-live.mjs');
const raw={properties:{meta:{units:{air_temperature:'celsius'}},timeseries:[{time:'2026-10-07T04:00:00Z',data:{instant:{details:{air_temperature:22.2}}}}]}};
const live=normalizeMET(raw,'2026-10-07T04:55:00Z','https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=37.5665&lon=126.9780');assert.equal(live.normalized_value,22.2);assert.equal(live.record_date,'2026-10-07');assert.equal(live.unit,'°C');assert.throws(()=>normalizeMET({},live.fetched_at,live.source_url));assert.throws(()=>normalizeMET(raw,'2026-10-08T04:55:00Z',live.source_url));console.log('PASS: live forecast schema, unit normalization, KST date and expired forecast rejection.');
