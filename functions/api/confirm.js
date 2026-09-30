function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8"}})}
function b64url(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function accessToken(env){
 const body=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:env.GOOGLE_REFRESH_TOKEN,grant_type:"refresh_token"});
 const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});
 if(!r.ok)throw new Error("Google authorization failed");
 return (await r.json()).access_token;
}
async function liveSlots(date){
 const api="https://mythworkinghouse.simplybook.me/v2/booking/time-slots/?from="+date+"&to="+date+"&location=&category=&provider=19&service=2&count=1&booking_id=";
 const r=await fetch(api,{headers:{Accept:"application/json"}});
 if(!r.ok)throw new Error("Availability check failed");
 return (await r.json()).filter(x=>x.type==="free").map(x=>String(x.client_time||x.time).slice(0,5));
}
export async function onRequestPost({request,env}){
 try{
  const {date,time}=await request.json();
  if(!/^2026-10-(0[1-9]|[12]\d|3[01])$/.test(date||"")||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||""))return json({error:"日期或時間格式錯誤"},400);
  if(!(await liveSlots(date)).includes(time))return json({error:"這個時段剛剛被選走了，請重新選時間"},409);
  const token=await accessToken(env), start=new Date(date+"T"+time+":00+08:00"), end=new Date(start.getTime()+90*60000);
  const key="date-invite-"+date+"-"+time.replace(":","");
  const q=encodeURIComponent("privateExtendedProperty=inviteKey="+key+"&timeMin="+start.toISOString()+"&timeMax="+end.toISOString());
  const existing=await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?"+q,{headers:{Authorization:"Bearer "+token}});
  if(!existing.ok)throw new Error("Calendar lookup failed");
  if((await existing.json()).items?.length)return json({ok:true,duplicate:true});
  const event={summary:"33 VS ALAN｜PK 任務",description:"吃什麼：到時候看心情\n流程：吃飽 → PK → 逛逛\n輸的人請喝飲料。",start:{dateTime:start.toISOString(),timeZone:"Asia/Taipei"},end:{dateTime:end.toISOString(),timeZone:"Asia/Taipei"},extendedProperties:{private:{inviteKey:key}}};
  const cr=await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events",{method:"POST",headers:{Authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify(event)});
  if(!cr.ok)throw new Error("Calendar create failed");
  const subject="33 VS ALAN｜任務確認 "+date+" "+time;
  const mime="To: from5912@gmail.com\r\nSubject: =?UTF-8?B?"+btoa(unescape(encodeURIComponent(subject)))+"?=\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n33 已確認任務。\n時間："+date+" "+time+"\n行程已建立到 Google Calendar。";
  const mr=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({raw:b64url(mime)})});
  if(!mr.ok)throw new Error("Mail send failed");
  return json({ok:true});
 }catch(e){return json({error:e.message||"建立失敗"},500)}
}
