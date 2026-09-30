function json(data,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}})}
async function accessToken(env){
 const body=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:env.GOOGLE_REFRESH_TOKEN,grant_type:"refresh_token"});
 const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
 if(!r.ok)throw new Error("Google authorization failed");
 return (await r.json()).access_token;
}
function b64url(s){const bytes=new TextEncoder().encode(s);let bin="";for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
export async function onRequestPost({request,env}){
 try{
  const {date,time}=await request.json();
  if(!/^2026-10-\d{2}$/.test(date||"")||!/^\d{2}:\d{2}$/.test(time||""))return json({error:"日期或時間格式錯誤"},400);
  const slotsUrl=new URL("/api/slots",request.url);slotsUrl.searchParams.set("date",date);
  const sr=await fetch(slotsUrl);const slots=sr.ok?await sr.json():[];
  if(!slots.includes(time))return json({error:"這個時段目前已經沒有空位，請重新選擇"},409);
  if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.GOOGLE_REFRESH_TOKEN)return json({error:"Google 尚未完成授權設定"},503);
  const token=await accessToken(env),start=date+"T"+time+":00+08:00";
  const endDate=new Date(start);endDate.setMinutes(endDate.getMinutes()+90);const end=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(endDate).replace(" ","T")+"+08:00";
  const key="date-invite-"+date+"-"+time;
  const q=encodeURIComponent('privateExtendedProperty=inviteKey='+key);
  const check=await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?"+q,{headers:{Authorization:"Bearer "+token}});
  const found=check.ok?(await check.json()).items||[]:[];
  if(found.length)return json({ok:true,duplicate:true});
  const event={summary:"33 VS ALAN｜PK 任務",description:"約會邀請確認\n吃什麼：到時候看心情\n行程：吃飽 → PK → 逛逛",start:{dateTime:start,timeZone:"Asia/Taipei"},end:{dateTime:end,timeZone:"Asia/Taipei"},extendedProperties:{private:{inviteKey:key}}};
  const cr=await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(event)});
  if(!cr.ok)throw new Error("Calendar event creation failed");
  const subject="33 約會邀請已確認｜"+date+" "+time;
  const msg=["To: from5912@gmail.com","Subject: =?UTF-8?B?"+btoa(unescape(encodeURIComponent(subject)))+"?=","Content-Type: text/plain; charset=UTF-8","","33 已確認約會邀請。","時間："+date+" "+time,"行程：吃飽 → PK → 逛逛","吃什麼：到時候看心情"].join("\r\n");
  await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({raw:b64url(msg)})});
  return json({ok:true});
 }catch(e){return json({error:"任務建立失敗，請稍後再試"},500)}
}