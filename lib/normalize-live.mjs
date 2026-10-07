import {kstDate,validateNormalizedReading} from './board-engine.mjs';
export function normalizeMET(raw,fetched,source){
 const rows=raw?.properties?.timeseries;
 if(!Array.isArray(rows)||raw?.properties?.meta?.units?.air_temperature!=='celsius')throw new Error('schema_error');
 const now=new Date(fetched).getTime();
 const candidate=rows.filter(r=>typeof r.time==='string'&&Number.isFinite(Date.parse(r.time))).sort((a,b)=>Math.abs(Date.parse(a.time)-now)-Math.abs(Date.parse(b.time)-now))[0];
 const value=candidate?.data?.instant?.details?.air_temperature;
 if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(Date.parse(candidate.time)-now)>3*3600000)throw new Error('schema_error');
 const reading={signal_id:'seoul-forecast-temperature',normalized_value:value,unit:'°C',source_name:'MET Norway · 현재 시각의 예보 기온',source_url:source,source_time:new Date(candidate.time).toISOString(),fetched_at:fetched,record_timezone:'Asia/Seoul',record_date:kstDate(fetched)};
 validateNormalizedReading(reading);return reading;
}
