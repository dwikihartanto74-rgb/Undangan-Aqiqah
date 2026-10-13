/** Cloudflare Pages Function: frontend calls same-origin /api */
export async function onRequest({request,env}){
 if(request.method==='GET')return Response.json({success:true,message:'Nareendra Aqiqah API aktif'});
 if(request.method!=='POST')return Response.json({success:false,message:'Method tidak didukung.'},{status:405});
 if(!env.GAS_WEB_APP_URL||!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(env.GAS_WEB_APP_URL))return Response.json({success:false,message:'Environment GAS_WEB_APP_URL belum diisi dengan URL Web App Apps Script yang berakhir /exec.'},{status:500});
 let body;try{body=await request.json()}catch{return Response.json({success:false,message:'Request JSON tidak valid.'},{status:400})}
 if(!['getInvitationData','getGuestMessages','submitRSVP'].includes(String(body.action||'')))return Response.json({success:false,message:'Aksi API tidak diizinkan.'},{status:400});
 try{const upstream=await fetch(env.GAS_WEB_APP_URL,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:body.action,data:body.data||{}})});const raw=await upstream.text();let result;try{result=JSON.parse(raw)}catch{return Response.json({success:false,message:'Apps Script tidak mengembalikan JSON. Periksa deployment Web App /exec dan izin akses.',upstreamStatus:upstream.status},{status:502})}return Response.json(result,{status:upstream.ok?200:502})}catch(err){return Response.json({success:false,message:'Gagal menghubungi Apps Script.',detail:String(err&&err.message||err).slice(0,150)},{status:502})}
}
