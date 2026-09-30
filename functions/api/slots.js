export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const date = u.searchParams.get("date");
  if (!/^2026-10-\d{2}$/.test(date || "")) return Response.json([], {status:400});
  const api = "https://mythworkinghouse.simplybook.me/v2/booking/time-slots/?from="+date+"&to="+date+"&location=&category=&provider=19&service=2&count=1&booking_id=";
  try {
    const r = await fetch(api, {headers:{"Accept":"application/json"}});
    if (!r.ok) return Response.json([], {status:502});
    const data = await r.json();
    const slots = data.filter(x=>x.type==="free").map(x=>String(x.client_time||x.time).slice(0,5));
    return Response.json(slots, {headers:{"Cache-Control":"public, max-age=60"}});
  } catch(e) { return Response.json([], {status:502}); }
}
