import { normalizeMET } from "@/lib/normalize-live.mjs";
import { env } from "cloudflare:workers";
import { resetEvaluationState, applySuccessfulReading } from "@/lib/board-engine.mjs";
export const dynamic = "force-dynamic";
const SOURCE = "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=37.5665&lon=126.9780";
const headers = {"Cache-Control":"no-store"};
async function snapshot() {
 const db=env.DB!;
 const rows=await db.prepare("SELECT * FROM daily_readings ORDER BY updated_at ASC").all<any>();
 let state=resetEvaluationState();
 for(const row of rows.results) state=applySuccessfulReading(state,JSON.parse(row.reading));
 const status=await db.prepare("SELECT * FROM board_status WHERE id='seoul'").first<any>();
 if(status){state.status=JSON.parse(status.status);state.last_attempt_at=status.attempted_at;}
 const snapshots=await db.prepare("SELECT id,reading,created_at FROM evidence ORDER BY created_at ASC").all<any>();
 return {...state,raw_readings:rows.results.map((r:any)=>({record_id:r.id,reading:JSON.parse(r.reading),raw:JSON.parse(r.raw)})),evidence:snapshots.results.map((r:any)=>({id:r.id,reading:JSON.parse(r.reading),created_at:r.created_at})),source_url:SOURCE};
}
export async function GET(){try{return Response.json(await snapshot(),{headers})}catch{return Response.json({error:"저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."},{status:503,headers})}}
export async function POST(request:Request){
 if(request.headers.get("origin") && request.headers.get("origin")!==new URL(request.url).origin)return new Response("Forbidden",{status:403});
 if(!env.DB)return Response.json({error:"저장소 연결이 필요합니다."},{status:503,headers});
 const started=new Date().toISOString();let reading:any,raw:any,errorCode="none";let retryAfter:number|null=null;
 try{
  const response=await fetch(SOURCE,{signal:AbortSignal.timeout(8000),headers:{Accept:"application/json","User-Agent":"SeoulRealBoard/1.0 (+https://seoul-real-board-kjh.kjhw7849.chatgpt.site)"}});
  if(response.status===401||response.status===403)errorCode="auth";
  else if(response.status===429){errorCode="rate_limit";const v=Number(response.headers.get("retry-after"));retryAfter=Number.isFinite(v)&&v>0?v:null;}
  else if(!response.ok)errorCode="upstream_error";
  else {
   raw=await response.json();
   const fetched=new Date().toISOString();
   reading=normalizeMET(raw,fetched,SOURCE);
   applySuccessfulReading(resetEvaluationState(),reading);
  }
 }catch(e:any){errorCode=e.name==="TimeoutError"||e.name==="AbortError"?"timeout":e.message==="schema_error"||e instanceof SyntaxError?"schema_error":"offline";}
 try{
  const status=JSON.stringify({freshness:errorCode==="none"?"fresh":"stale",error_code:errorCode,retry_after_seconds:retryAfter});
  const statements=[];
  if(reading){
   const id=reading.signal_id+"-"+reading.record_date;
   statements.push(env.DB.prepare("INSERT INTO daily_readings(id,reading,raw,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET reading=excluded.reading,raw=excluded.raw,updated_at=excluded.updated_at WHERE excluded.updated_at>=daily_readings.updated_at").bind(id,JSON.stringify(reading),JSON.stringify(raw),reading.fetched_at));
   statements.push(env.DB.prepare("INSERT INTO evidence(id,reading,raw,created_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(),JSON.stringify(reading),JSON.stringify(raw),reading.fetched_at));
  }
  statements.push(env.DB.prepare("INSERT INTO board_status(id,status,attempted_at) VALUES('seoul',?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,attempted_at=excluded.attempted_at WHERE excluded.attempted_at>=board_status.attempted_at").bind(status,started));
  await env.DB.batch(statements);
  return Response.json(await snapshot(),{headers});
 }catch{return Response.json({error:"조회 결과를 저장하지 못했습니다. 기존 기록은 그대로 보존됩니다."},{status:503,headers})}
}
