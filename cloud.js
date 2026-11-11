// Authentication is a UI gate; database policies enforce approval and ownership.
const byId = id => document.getElementById(id);
const message = text => { byId('accountMessage').textContent = text; };
const noticeVersion = '2026-11-11-v2';
const config = window.CLEANQUOTE_CLOUD || {};
let client, account, revision = 0, payload = {}, generation = 0, saved = 0;
let running = false, failed = false, formChanged = false;
const clone = value => structuredClone(value);
const status = text => { byId('syncStatus').textContent = text; };
function fail(error) {
  console.error(error);
  message(error.message || '요청에 실패했습니다. 잠시 후 다시 시도하세요.');
  status(error.message || '요청에 실패했습니다.');
}
function button(label, action) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
  b.onclick = async () => { b.disabled = true; try { await action(); } catch(e) { fail(e); } finally { b.disabled = false; } };
  return b;
}
async function flush() {
  if (running || failed || generation === saved) return;
  running = true;
  try {
    while (saved < generation) {
      const target = generation, document = clone(payload);
      status('서버에 저장 중… 이 화면을 닫지 마세요.');
      const {data, error} = await client.rpc('cq_save', {owner: account.id, expected_revision: revision, document});
      if (error) throw error;
      revision = Number(data); saved = target;
    }
    status('서버 저장 완료 · 다른 기기에서도 불러올 수 있습니다.');
  } catch(e) {
    failed = true;
    status(String(e.message).includes('SYNC_CONFLICT')
      ? '다른 기기에서 변경되었습니다. 현재 데이터를 백업한 뒤 최신 데이터를 불러오세요.'
      : '서버에 저장하지 못했습니다. 현재 데이터를 백업하고 연결·승인 상태를 확인하세요.');
  } finally { running = false; }
}
window.Cloud = {
  load(key, fallback) {
    if(payload[key]===undefined && key==='cleanquote_offline_settings_v1' && account) return {...clone(fallback),company:account.company};
    return clone(payload[key] ?? fallback);
  },
  persist(key, value) {
    payload[key] = clone(value); generation++;
    if(!failed) status('서버 저장 대기 중…');
    queueMicrotask(flush); return true;
  }
};
window.addEventListener('beforeunload', e => {
  if (generation !== saved || formChanged) { e.preventDefault(); e.returnValue = ''; }
});
byId('reloadCloud').onclick = () => {
  if ((generation !== saved || formChanged) && !confirm('저장되지 않은 변경이 있습니다. 먼저 저장 목록에서 JSON 백업을 받으세요. 그래도 최신 서버 데이터로 새로고침할까요?')) return;
  generation = saved; formChanged = false; location.reload();
};
byId('retryCloud').onclick = () => { failed = false; flush(); };
byId('logoutCloud').onclick = async () => {
  if ((generation !== saved || formChanged) && !confirm('아직 저장되지 않은 변경이 있습니다. 백업하지 않고 로그아웃할까요?')) return;
  generation = saved; formChanged = false;
  const {error} = await client.auth.signOut(); if(error) return fail(error);
  location.reload();
};
let withdrawalBusy=false;
byId('openWithdrawal').onclick = () => {
  byId('withdrawPassword').value='';byId('withdrawConfirmation').value='';
  byId('withdrawMessage').textContent='';byId('withdrawDialog').showModal();
};
byId('cancelWithdrawal').onclick = () => {if(!withdrawalBusy)byId('withdrawDialog').close();};
byId('withdrawDialog').addEventListener('cancel',e=>{if(withdrawalBusy)e.preventDefault();});
byId('withdrawForm').onsubmit = async e => {
  e.preventDefault();if(withdrawalBusy)return;
  if(byId('withdrawConfirmation').value.trim()!=='회원탈퇴') {byId('withdrawMessage').textContent='회원탈퇴 문구를 정확히 입력해 주세요.';return;}
  withdrawalBusy=true;e.submitter.disabled=true;byId('cancelWithdrawal').disabled=true;
  byId('withdrawMessage').textContent='비밀번호를 확인하고 있습니다…';
  try {
    const authResult=await client.auth.signInWithPassword({email:account.email,password:byId('withdrawPassword').value});
    byId('withdrawPassword').value='';if(authResult.error)throw Error('비밀번호를 확인해 주세요.');
    byId('withdrawMessage').textContent='계정과 저장 데이터를 삭제하고 있습니다…';
    const {error}=await client.rpc('cq_withdraw',{confirmation:'회원탈퇴'});if(error)throw error;
    generation=saved;formChanged=false;payload={};
    await client.auth.signOut({scope:'local'}).catch(()=>{});
    localStorage.removeItem('cleanquote-auth-v1');
    location.replace(location.origin+location.pathname+'?withdrawn=1');
  } catch(error) {byId('withdrawMessage').textContent=error.message||'탈퇴에 실패했습니다. 다시 시도해 주세요.';}
  finally {withdrawalBusy=false;e.submitter.disabled=false;byId('cancelWithdrawal').disabled=false;}
};
byId('loginForm').onsubmit = async e => {
  e.preventDefault(); const submit=e.submitter; submit.disabled=true;
  try {
    const {error} = await client.auth.signInWithPassword({email:byId('loginEmail').value.trim(),password:byId('loginPassword').value});
    if(error) throw error; location.reload();
  } catch(error) { fail(error); } finally { submit.disabled=false; }
};
byId('signupForm').onsubmit = async e => {
  e.preventDefault(); if(!byId('signupConsent').checked) return;
  const submit=e.submitter; submit.disabled=true;
  try {
    const {error} = await client.auth.signUp({email:byId('signupEmail').value.trim(),password:byId('signupPassword').value,
      options:{emailRedirectTo:location.origin+location.pathname,data:{company:byId('signupCompany').value.trim(),notice_version:noticeVersion,service_consent:true,admin_consent:true}}});
    if(error) throw error;
    byId('signupPassword').value=''; message('가입을 요청했습니다. 이메일 인증 후 관리자 승인을 기다려 주세요.');
  } catch(error) { fail(error); } finally { submit.disabled=false; }
};
byId('noticeUpdateForm').onsubmit = async e => {
 e.preventDefault(); if(!byId('updatedConsent').checked) return;
 const submit=e.submitter;submit.disabled=true;
 try {const {error}=await client.rpc('cq_accept_notice',{service_consent:true,admin_consent:true});if(error)throw error;location.reload();}
 catch(error){fail(error);}finally{submit.disabled=false;}
};
byId('resetPassword').onclick = async () => {
  const email=byId('loginEmail').value.trim(); if(!email) return message('로그인 이메일을 먼저 입력하세요.');
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  if(error) return fail(error); message('등록된 이메일이면 비밀번호 재설정 안내가 발송됩니다.');
};
byId('newPasswordForm').onsubmit = async e => {
  e.preventDefault(); const {error}=await client.auth.updateUser({password:byId('newPassword').value});
  if(error) return fail(error); location.replace(location.origin+location.pathname);
};
function exportLegacyBackup() {
  try {
    const read=(key,fallback)=>JSON.parse(localStorage.getItem(key)||'null')??fallback;
    const backup={version:1,records:read('cleanquote_offline_records_v1',[]),settings:read('cleanquote_offline_settings_v1',{}),templates:read('cleanquote_offline_templates_v1',{})};
    const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='견적서_업데이트전_데이터백업.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  } catch(e) {fail(Error('기존 데이터 백업을 읽지 못했습니다. 원래 브라우저에서 다시 확인하세요.'));}
}
byId('legacyBackup').onclick = exportLegacyBackup;
byId('legacyBackupLoggedIn').onclick = exportLegacyBackup;
async function renderAdmin() {
  const root=byId('adminAccounts'); root.replaceChildren();
  const {data,error}=await client.from('cq_accounts').select('id,email,company,status,is_admin,notice_version,notice_accepted_at').order('created_at',{ascending:false});
  if(error) throw error;
  for(const a of data) {
    const row=document.createElement('div'); row.className='card';
    const title=document.createElement('strong'); title.textContent=a.company;
    const meta=document.createElement('p'); meta.textContent=`${a.email} · ${{pending:"승인 대기",approved:"이용 중",suspended:"이용 정지"}[a.status]||a.status} · 안내 확인 ${new Date(a.notice_accepted_at).toLocaleString('ko-KR')}`;
    row.append(title,meta);
    if(!a.is_admin) for(const [label,next] of [['승인','approved'],['이용 정지','suspended']]) {
      row.append(button(label,async()=>{
        const {error}=await client.rpc('cq_admin_status',{target_id:a.id,next_status:next});
        if(error) throw error; await renderAdmin();
      }));
    }
    row.append(button('견적서 조회',async()=>{
      const {data,error}=await client.rpc('cq_admin_document',{target_id:a.id}); if(error) throw error;
      const detail=byId('adminDetail'); detail.replaceChildren();
      const heading=document.createElement('h3'); heading.textContent=a.company+'의 저장된 견적서'; detail.append(heading);
      const list=data.cleanquote_offline_records_v1 || [];
      if(!list.length) detail.append(document.createTextNode('저장된 견적서가 없습니다.'));
      const labels={client:'고객명',phone:'연락처',address:'주소',date:'견적일',recipient:'수신 이메일',service:'서비스',frequency:'주기',industry:'업종',scope:'작업 범위',price:'공급가액',priceUnit:'견적 기준',notes:'추가 안내'};
      for(const r of list) {
        const d=document.createElement('details'), summary=document.createElement('summary'); summary.textContent=(r.data?.client||'이름 없음')+' · '+(r.data?.date||''); d.append(summary);
        const dl=document.createElement('dl'); for(const [key,label] of Object.entries(labels)) {
          const dt=document.createElement('dt'),dd=document.createElement('dd'); dt.textContent=label; dd.textContent=String(r.data?.[key]??''); dl.append(dt,dd);
        } d.append(dl);detail.append(d);
      }
      const common=data.cleanquote_offline_settings_v1?.standardNotice;
      if(common) {const p=document.createElement('p');p.textContent='업체 공통 안내: '+common;detail.append(p);}
      detail.scrollIntoView({behavior:'smooth'});
    }));
    root.append(row);
  }
}
byId('refreshAdmin').onclick = () => renderAdmin().catch(fail);
byId('loadAudit').onclick = async () => {
  const {data,error}=await client.rpc('cq_admin_audit'); if(error) return fail(error);
  byId('adminAudit').textContent=data.map(r=>`${new Date(r.created_at).toLocaleString('ko-KR')} · ${r.action} · 관리자 ${r.actor||'탈퇴한 계정'} · 대상 ${r.target||'탈퇴한 계정'}`).join('\n') || '기록이 없습니다.';
};
async function start() {
  if(!config.url || !config.publicKey) {
    message('로그인 서버 연결 준비 중입니다. 기존 서비스의 데이터는 변경되지 않았습니다.');
    document.querySelectorAll('#accountGate button').forEach(b=>b.disabled=true); return;
  }
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm');
  client=createClient(config.url,config.publicKey,{auth:{storageKey:'cleanquote-auth-v1'}});
  const recovery=location.hash.includes('type=recovery');
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY') { byId('newPasswordForm').hidden=false; }
    if(event==='SIGNED_OUT' && account && !withdrawalBusy) { generation=saved;formChanged=false;location.reload(); }
    if(account && session && session.user.id!==account.id) { failed=true;generation=saved;formChanged=false;location.reload(); }
  });
  if(recovery) {byId('newPasswordForm').hidden=false;return;}
  const {data:{user},error}=await client.auth.getUser();
  if(error || !user) {message(new URLSearchParams(location.search).has('withdrawn')?'회원 탈퇴가 완료되었습니다. 계정과 서버에 저장된 설정·견적서를 삭제했습니다.':'로그인하거나 가입 승인을 요청하세요.'); return;}
  const profile=await client.from('cq_accounts').select('*').eq('id',user.id).single();
  if(profile.error) throw profile.error; account=profile.data;
  byId('accountBar').hidden=false; byId('accountName').textContent=account.company+' · '+account.email;
  byId('openWithdrawal').hidden=account.is_admin;
  if(account.notice_version!==noticeVersion) {
    byId('loginForm').hidden=true;byId('signupSection').hidden=true;byId('noticeUpdateForm').hidden=false;
    message('이용 안내가 변경되었습니다. 확인 후 동의하면 계속 이용할 수 있습니다.');return;
  }
  if(account.status!=='approved') {message(account.status==='pending'?'가입 승인 대기 중입니다. 관리자 승인 후 다시 로그인하세요.':'이용이 정지된 계정입니다. 운영자에게 문의하세요.');return;}
  const result=await client.from('cq_documents').select('payload,revision').eq('owner_id',user.id).single();
  if(result.error) throw result.error; payload=result.data.payload;revision=Number(result.data.revision);
  const script=document.createElement('script');script.src='app.js?v=10-sauna';
  await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(Error('견적 기능을 불러오지 못했습니다.'));document.body.append(script);});
  byId('accountGate').hidden=true;document.querySelector('main').hidden=false;
  byId('cloudControls').hidden=false;status('서버 데이터를 불러왔습니다.');
  document.querySelector('main').addEventListener('input',()=>{formChanged=true;});
  if(account.is_admin) { byId('adminPanel').hidden=false;await renderAdmin(); }
  setInterval(async()=>{
    if(document.hidden || running || generation!==saved) return;
    const check=await client.from('cq_documents').select('revision').eq('owner_id',user.id).single();
    if(check.error) { status('접근 권한 또는 연결 상태를 확인하세요.');return; }
    if(Number(check.data.revision)!==revision) status('다른 기기에 새 변경이 있습니다. 최신 데이터 불러오기를 눌러주세요.');
  },30000);
}
start().catch(fail);
