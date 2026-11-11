'use strict';
const $=id=>document.getElementById(id);const money=n=>Math.round(Number(n)||0).toLocaleString('ko-KR')+'원';const KEY='cleanquote_offline_records_v1',SET='cleanquote_offline_settings_v1',TPL='cleanquote_offline_templates_v1';
const defaults={'사무실':'사무실 바닥 먼지 및 오염 제거\n책상 및 공용 가구 표면 청소\n출입문 유리 및 손잡이 세척\n탕비실 및 화장실 위생 관리\n쓰레기 수거 및 분리배출','병원·치과':'대기실 및 복도 바닥 청소\n접수대 및 비의료 접촉 표면 청소\n화장실 세척 및 소모품 정리\n출입문 유리 및 손잡이 청소\n의료폐기물 및 의료기기 관리는 별도 협의','학원':'강의실 및 복도 바닥 청소\n책상과 의자 표면 먼지 제거\n출입문 및 창틀 청소\n화장실 위생 관리\n쓰레기 수거 및 분리배출','식당·카페':'홀 바닥 및 테이블 청소\n출입문 유리 및 손잡이 청소\n고객 화장실 청소\n쓰레기 분리배출\n주방 후드 및 전문 세척은 별도 협의','상가·건물':'공용 로비 및 복도 청소\n계단 및 난간 먼지 제거\n엘리베이터 내부 청소\n공용 화장실 청소\n출입구 유리 청소','헬스장':'운동공간 바닥 청소\n운동기구 외부 표면 청소\n탈의실 및 샤워실 청소\n거울 및 유리 세척\n쓰레기 수거','교회·종교시설':'예배실 및 복도 바닥 청소\n의자 및 가구 먼지 제거\n출입구 및 공용공간 청소\n화장실 청소\n쓰레기 수거','주거·특수청소':'현장 오염 상태 확인 및 구역별 작업\n바닥 및 벽면 오염 제거\n폐기물 분리 및 수거 범위 협의\n필요 시 전문 장비 및 약품 적용\n특수 폐기물 처리는 별도 협의' ,"사우나 및 샤워시설":"탈의실 | 바닥 먼지·머리카락 제거 및 사물함 외부 표면 청소\n샤워실 | 바닥·벽면 타일의 물때·비누때 제거 및 세척\n샤워기·수전 | 외부 오염 제거와 세면대 세척\n배수구 | 덮개·거름망의 머리카락과 이물질 제거\n사우나실 | 운영 종료 및 충분한 냉각 후 바닥·벤치 표면 청소\n탕·욕조 | 배수 후 내부 물때·오염 세척 (해당 시설에 한함)\n거울·유리 | 거울·출입문 유리와 손잡이 세척\n화장실 | 변기·세면대·바닥 위생 청소\n공용공간 | 휴게실 바닥 청소 및 쓰레기 수거·분리배출\n작업 마무리 | 세척 잔수 제거·건조 및 현장 환기\n별도 협의 | 배관·보일러·여과설비·저수조 및 고소 구간 전문 세척"};
const fields=['client','phone','address','date','recipient','service','frequency','industry','scope','price','priceUnit','notes'];let currentId=null;let templates=load(TPL,defaults);let records=load(KEY,[]);let settings=load(SET,{company:'청춘클린랩',companyPhone:'',companyEmail:'',companyAddress:'',managerName:'',managerRole:'',website:'',businessCard:'',companyLogo:'',includeBusinessCard:true,watermarkEnabled:true,watermarkOpacity:12,watermarkSize:'large',watermarkPosition:'center',showBusinessCard:true,showWebsiteButton:true,websiteButtonLabel:'홈페이지 바로가기',websiteButtonColor:'#153B62',includeStandardNotice:true,standardNotice:''});let deferredInstall=null;
function load(k,f){return window.Cloud.load(k,f)}function persist(k,v){return window.Cloud.persist(k,v)}function toast(t){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.style.display='none',3600)}
function getData(){const d={};for(const k of fields)d[k]=$(k).value;return d}function setData(d){for(const k of fields)if(d[k]!==undefined)$(k).value=d[k];calculate()}function calculate(){let p=Math.max(0,Math.round(Number($('price').value)||0)),v=Math.round(p*.1);$('subtotal').textContent=money(p);$('vat').textContent=money(v);$('total').textContent=money(p+v)}function updateIndustry(){const selected=$('industry').value;$('scope').value=templates[selected]||''}function initIndustry(){const sel=$('industry');sel.replaceChildren();for(const name of Object.keys(templates)){const o=document.createElement('option');o.textContent=name;o.value=name;sel.append(o)}updateIndustry()}
function save(){const d=getData();if(!d.client.trim()){toast('고객명을 입력하세요.');$('client').focus();return}const id=currentId||('q'+Date.now());const record={id,updatedAt:new Date().toISOString(),data:d};records=records.filter(x=>x.id!==id);records.unshift(record);if(persist(KEY,records)){currentId=id;renderHistory();toast('견적서를 저장 요청했습니다. 서버 저장 상태를 확인하세요.')}}function renderHistory(){const el=$('historyList');el.replaceChildren();if(!records.length){el.innerHTML='<div class="card">저장된 견적서가 없습니다.</div>';return}for(const r of records){const wrap=document.createElement('div');wrap.className='history-item';const name=document.createElement('strong');name.textContent=r.data.client||'이름 없음';const meta=document.createElement('small');meta.textContent=[r.data.date,r.data.service,money((Number(r.data.price)||0)*1.1)].join(' · ');const row=document.createElement('div');row.className='row';const loadBtn=document.createElement('button');loadBtn.textContent='불러오기';loadBtn.onclick=()=>{currentId=r.id;setData(r.data);switchTab('editor');toast('견적서를 불러왔습니다.')};const del=document.createElement('button');del.className='danger';del.textContent='삭제';del.onclick=()=>{if(confirm('이 견적서를 삭제할까요?')){records=records.filter(x=>x.id!==r.id);persist(KEY,records);if(currentId===r.id)currentId=null;renderHistory()}};row.append(loadBtn,del);wrap.append(name,meta,row);el.append(wrap)}}function switchTab(name){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id===name));scrollTo({top:0,behavior:'smooth'})}
function wrapText(ctx,text,maxWidth){const result=[];for(const paragraph of String(text||'').split(/\r?\n/)){if(!paragraph){result.push('');continue}let line='';for(const ch of paragraph){if(ctx.measureText(line+ch).width>maxWidth&&line){result.push(line);line=ch}else line+=ch}result.push(line)}return result}
function drawWatermark(ctx,W,H,img){
 if(settings.watermarkEnabled===false||!img)return;
 const opacity=Math.min(.2,Math.max(.02,(Number(settings.watermarkOpacity)||12)/100));
 const scale={small:.45,medium:.65,large:.85}[settings.watermarkSize]||.85;
 const w=W*scale,h=w*img.height/img.width;
 const y=settings.watermarkPosition==='top'?H*.19:settings.watermarkPosition==='bottom'?H*.75:H*.5;
 ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(img,(W-w)/2,y-h/2,w,h);ctx.restore();
}
function buildPages(d,cardImage,logoImage,watermarkImage){const W=1240,H=1754,M=100,usable=W-2*M;const company=settings.company||'청춘클린랩';const canvases=[];let c,ctx,y,page=0;function newPage(){c=document.createElement('canvas');c.width=W;c.height=H;ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);drawWatermark(ctx,W,H,watermarkImage);canvases.push(c);page++;y=104;ctx.fillStyle='#124d88';ctx.fillRect(M,72,8,65);let nameX=M+26;if(logoImage){const lw=110,lh=74,scale=Math.min(lw/logoImage.width,lh/logoImage.height);const iw=logoImage.width*scale,ih=logoImage.height*scale;ctx.drawImage(logoImage,nameX,78+(lh-ih)/2,iw,ih);nameX+=125}ctx.font='bold 46px sans-serif';ctx.fillText(company,nameX,120,Math.max(160,W-M-nameX));ctx.fillStyle='#75869b';ctx.font='24px sans-serif';ctx.fillText('CLEANING SERVICE QUOTATION',M+27,157);ctx.fillStyle='#14375b';ctx.font='bold 53px sans-serif';ctx.fillText('청소 서비스 견적서',M,253);ctx.strokeStyle='#d8e3f0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,282);ctx.lineTo(W-M,282);ctx.stroke();y=324}function section(title){if(y>H-240)newPage();ctx.fillStyle='#155c9f';ctx.font='bold 30px sans-serif';ctx.fillText(title,M,y);y+=28;ctx.strokeStyle='#d7e3f1';ctx.beginPath();ctx.moveTo(M,y+10);ctx.lineTo(W-M,y+10);ctx.stroke();y+=52}function line(label,value){ctx.font='25px sans-serif';const lines=wrapText(ctx,value,usable-240);if(y+Math.max(1,lines.length)*41>H-140)newPage();ctx.fillStyle='#6d8095';ctx.fillText(label,M,y);ctx.fillStyle='#203b58';ctx.font='25px sans-serif';lines.forEach((t,i)=>ctx.fillText(t,M+225,y+i*39));y+=Math.max(1,lines.length)*41+13}function paragraph(value){ctx.font='25px sans-serif';for(const l of wrapText(ctx,value,usable)){if(y>H-145)newPage();ctx.fillStyle='#243d58';ctx.fillText(l,M+8,y);y+=42}}function scopeList(value){
 const items=String(value||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
 if(!items.length){paragraph('별도 협의');return;}
 const gap=13,pad=20,fontSize=25,rowLine=38;
 ctx.font=`${fontSize}px sans-serif`;
 for(let i=0;i<items.length;i++){
  // The content wraps within each item, while the label and card remain together.
  const lines=wrapText(ctx,items[i],usable-135);
  const height=Math.max(69,30+lines.length*rowLine);
  if(y+height+gap>H-145)newPage();
  const top=y-25;
  // Premium B: transparent scope area keeps the background watermark visible.
  ctx.strokeStyle='#d8dee5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M+12,top+height-1);ctx.lineTo(M+usable-12,top+height-1);ctx.stroke();
  // White background: no colored badge behind scope number.
  ctx.fillStyle='#edf1f5';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(M+15,top+height/2-22,62,44,8);else ctx.rect(M+15,top+height/2-22,62,44);ctx.fill();ctx.fillStyle='#40546c';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText(String(i+1).padStart(2,'0'),M+46,top+height/2+8);ctx.textAlign='left';
  ctx.fillStyle='#253344';ctx.font=`${fontSize}px sans-serif`;
  const startY=top+(height-lines.length*rowLine)/2+28;
  lines.forEach((line,j)=>ctx.fillText(line,M+93,startY+j*rowLine));
  y+=height+gap;
 }
 y+=12;
}
function drawWebsiteButton(url){
 if(settings.showWebsiteButton===false||!url)return;
 if(y+135>H-145)newPage();
 const bx=M,by=y-8,bw=usable,bh=104;
 ctx.fillStyle=/^#[0-9a-f]{6}$/i.test(settings.websiteButtonColor||'')?settings.websiteButtonColor:'#153B62';
 ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,bw,bh,18);else ctx.rect(bx,by,bw,bh);ctx.fill();
 ctx.fillStyle='#fff';ctx.font='bold 32px sans-serif';ctx.textAlign='center';
 const label=(settings.websiteButtonLabel||'홈페이지 바로가기').slice(0,35);
 ctx.fillText('↗  '+label,W/2,by+46,bw-45);
 ctx.font='21px sans-serif';ctx.fillStyle='#dce9f6';ctx.fillText('클릭하면 공식 홈페이지로 이동합니다',W/2,by+80,bw-40);
 ctx.textAlign='left';
 const target=canvases[canvases.length-1];target.pdfLinks=target.pdfLinks||[];
 target.pdfLinks.push({url,x:bx,y:by,w:bw,h:bh});y+=bh+30;
}
newPage();section('01  고객 및 현장 정보');line('고객명',d.client);line('연락처',d.phone);line('현장 주소',d.address);line('견적일',d.date);section('02  작업 내용');line('서비스',d.service);line('작업 주기',d.frequency);line('업종',d.industry);section('03  청소 작업 범위');scopeList(d.scope);if(y>H-340)newPage();section('04  견적 금액');const price=Math.max(0,Math.round(Number(d.price)||0)),vat=Math.round(price*.1);line('견적 기준',d.priceUnit);line('공급가액',money(price));line('부가세 (10%)',money(vat));ctx.fillStyle='#e8f3ff';ctx.fillRect(M,y-30,usable,80);ctx.fillStyle='#11579a';ctx.font='bold 34px sans-serif';ctx.fillText('총 견적 금액',M+22,y+22);ctx.textAlign='right';ctx.fillText(money(price+vat),W-M-22,y+22);ctx.textAlign='left';y+=115;const standard=(settings.includeStandardNotice!==false?String(settings.standardNotice||'').trim():'');const custom=String(d.notes||'').trim();if(standard||custom){section('05  추가 안내');if(standard)paragraph(standard);if(standard&&custom)y+=16;if(custom)paragraph(custom)}if(y>H-250)newPage();y+=30;section('발신 회사 정보');line('회사명',company);if(settings.companyPhone)line('연락처',settings.companyPhone);if(settings.companyEmail)line('이메일',settings.companyEmail);if(settings.companyAddress)line('주소',settings.companyAddress);
if(settings.includeBusinessCard!==false&&(settings.managerName||settings.managerRole||cardImage)){
  const cardHeight=cardImage&&settings.showBusinessCard!==false?270:0;
  if(y+190+cardHeight>H-140)newPage();
  section('담당자 안내');
  if(settings.managerName)line('담당자',settings.managerName);
  if(settings.managerRole)line('직책',settings.managerRole);
  if(settings.website&&normalizeWebsite(settings.website)){line('홈페이지',normalizeWebsite(settings.website));}
  if(cardImage&&settings.showBusinessCard!==false){
    if(y+cardHeight>H-130)newPage();
    const maxW=700,maxH=240,scale=Math.min(maxW/cardImage.width,maxH/cardImage.height);
    const iw=cardImage.width*scale,ih=cardImage.height*scale;
    ctx.fillStyle='#f3f7fb';ctx.fillRect(M,y-16,usable,ih+32);
    ctx.drawImage(cardImage,M+(usable-iw)/2,y,iw,ih);y+=ih+50;
  }
}
if(settings.website&&normalizeWebsite(settings.website))drawWebsiteButton(normalizeWebsite(settings.website));
canvases.forEach((canvas,i)=>{const x=canvas.getContext('2d');x.font='20px sans-serif';x.fillStyle='#8da0b4';x.fillText(company+' · 모바일 견적서',M,H-75);x.textAlign='right';x.fillText(`${i+1} / ${canvases.length}`,W-M,H-75)});return canvases}
// PDF v2: create JPEG pages asynchronously, construct byte-exact PDF offsets and validate output.
const encoder=new TextEncoder();
function ascii(s){return encoder.encode(s)}
function joinBytes(chunks){const total=chunks.reduce((n,c)=>n+c.byteLength,0);const result=new Uint8Array(total);let at=0;for(const c of chunks){result.set(c,at);at+=c.byteLength}return result}
function jpegBytes(canvas){return new Promise((resolve,reject)=>{canvas.toBlob(async blob=>{if(!blob){reject(new Error('이미지 변환에 실패했습니다.'));return}try{resolve(new Uint8Array(await blob.arrayBuffer()))}catch(e){reject(e)}},'image/jpeg',0.83)})}
async function pdfFromCanvases(canvases){
  if(!canvases.length)throw Error('PDF 페이지가 없습니다.');
  const objs=[null],add=()=>{objs.push(null);return objs.length-1};
  const catalog=add(),pages=add(),kids=[];
  for(const canvas of canvases){
    const jpg=await jpegBytes(canvas);
    if(jpg.length<4||jpg[0]!==0xff||jpg[1]!==0xd8)throw Error('JPEG 이미지 생성 실패');
    const image=add(),content=add(),page=add();
    const annotations=[];for(const link of (canvas.pdfLinks||[])){const a=add();const safe=link.url.replace(/[\\()]/g,ch=>'\\'+ch);const x=link.x*595/canvas.width, yy=842-(link.y+link.h)*842/canvas.height, w=link.w*595/canvas.width, h=link.h*842/canvas.height;objs[a]=ascii(`<< /Type /Annot /Subtype /Link /Rect [${x.toFixed(2)} ${yy.toFixed(2)} ${(x+w).toFixed(2)} ${(yy+h).toFixed(2)}] /Border [0 0 0] /A << /S /URI /URI (${safe}) >> >>`);annotations.push(`${a} 0 R`)}
    objs[image]=joinBytes([ascii(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`.replace(/\\n/g,'\n')),jpg,ascii('\nendstream')]);
    const draw=ascii('q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n');
    objs[content]=joinBytes([ascii(`<< /Length ${draw.length} >>\nstream\n`.replace(/\\n/g,'\n')),draw,ascii('endstream')]);
    objs[page]=ascii(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${image} 0 R >> >> /Contents ${content} 0 R ${annotations.length?`/Annots [${annotations.join(' ')}]`: ''} >>`);
    kids.push(`${page} 0 R`);
  }
  objs[pages]=ascii(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`);
  objs[catalog]=ascii(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
  // Binary PDF signature: do not UTF-8 encode the binary marker bytes.
  const chunks=[new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10])];
  const offsets=[0];let pos=chunks[0].length;
  for(let i=1;i<objs.length;i++){
    offsets[i]=pos;
    const object=joinBytes([ascii(`${i} 0 obj\n`),objs[i],ascii('\nendobj\n')]);
    chunks.push(object);pos+=object.length;
  }
  const xrefStart=pos;
  let xref=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for(let i=1;i<objs.length;i++)xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  xref+=`trailer\n<< /Size ${objs.length} /Root ${catalog} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  chunks.push(ascii(xref));
  const pdf=joinBytes(chunks);
  if(pdf.length<1000||String.fromCharCode(...pdf.slice(0,5))!=='%PDF-'||!ascii(xref).length)throw Error('PDF 형식 검증 실패');
  return new Blob([pdf],{type:'application/pdf'});
}
async function pdfFile(){
  const d=getData();if(!d.client.trim()){toast('PDF 생성 전 고객명을 입력하세요.');$('client').focus();return null}
  const cardImage=(settings.includeBusinessCard!==false&&settings.businessCard)?await loadCardImage(settings.businessCard):null;
  const logoImage=settings.companyLogo?await loadCardImage(settings.companyLogo):null;const watermarkImage=await loadCardImage('./assets/cheongchun-watermark.png');const pdf=await pdfFromCanvases(buildPages(d,cardImage,logoImage,watermarkImage));
  const safe=(d.client||'고객').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,32);
  const companySafe=(settings.company||'청춘클린랩').replace(/[\\/:*?"<>|]/g,'_');const name=companySafe+'_견적서_'+safe+'_'+(d.date||'날짜미정')+'.pdf';
  return new File([pdf],name,{type:'application/pdf'});
}
function download(file){
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.download=file.name;a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},60000);
}
function busy(value){for(const id of ['pdf','share'])$(id).disabled=value}
async function savePdf(){busy(true);try{const file=await pdfFile();if(!file)return;download(file);toast('PDF 다운로드를 요청했습니다. 갤럭시 내 파일 → 다운로드를 확인하세요.')}catch(e){console.error(e);toast('PDF 생성 실패: '+(e.message||'알 수 없는 오류'))}finally{busy(false)}}
async function share(){busy(true);try{
  const file=await pdfFile();if(!file)return;
  if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],title:'청춘클린랩 견적서',text:'청소 서비스 견적서를 전달드립니다.'});return}
    catch(e){if(e.name==='AbortError')return;console.warn('파일 공유 실패',e)}
  }
  download(file);
  toast('PDF를 다운로드했습니다. 네이트 메일 앱에서 첨부해 발송하세요.');
}catch(e){console.error(e);toast('메일 공유 준비 실패: '+(e.message||'알 수 없는 오류'))}finally{busy(false)}}
function normalizeWebsite(raw){let s=String(raw||'').trim();if(!s)return '';if(!/^https?:\/\//i.test(s))s='https://'+s;try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function loadCardImage(data){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('명함 이미지를 읽을 수 없습니다. 설정에서 다시 등록하세요.'));img.src=data})}
function refreshCompanyBrand(){const name=(settings.company||'청춘클린랩').trim();$('brandName').textContent=name;const mark=$('brandMark');mark.replaceChildren();if(settings.companyLogo){const img=document.createElement('img');img.src=settings.companyLogo;img.alt='회사 로고';img.style.cssText='width:100%;height:100%;object-fit:contain;border-radius:8px';mark.append(img)}else mark.textContent=(name[0]||'C').toUpperCase();document.title=name+' 견적서'}
function refreshCompanyLogoPreview(){const yes=!!settings.companyLogo;$('companyLogoPreviewWrap').hidden=!yes;if(yes)$('companyLogoPreview').src=settings.companyLogo;else $('companyLogoPreview').removeAttribute('src');refreshCompanyBrand();updateDesignPreview()}
$('companyLogoInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{if(!/^image\/(jpeg|png|webp)$/.test(f.type))throw Error('JPG, PNG, WEBP 파일만 가능합니다.');if(f.size>12*1024*1024)throw Error('로고 이미지 크기는 12MB 이하로 선택하세요.');const url=URL.createObjectURL(f);try{const img=await loadCardImage(url);const c=document.createElement('canvas');const scale=Math.min(1,600/img.width,600/img.height);c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);const next={...settings,companyLogo:c.toDataURL('image/jpeg',.85)};if(!persist(SET,next))throw Error('저장 공간이 부족합니다.');settings=next;refreshCompanyLogoPreview();toast('회사 로고를 등록했습니다.')}finally{URL.revokeObjectURL(url)}}catch(err){toast(err.message||'로고 등록 실패')}finally{e.target.value=''}};
$('removeCompanyLogo').onclick=()=>{settings.companyLogo='';persist(SET,settings);refreshCompanyLogoPreview();toast('회사 로고를 삭제했습니다.')};
function refreshCardPreview(){const yes=!!settings.businessCard;$('businessCardPreviewWrap').hidden=!yes;if(yes)$('businessCardPreview').src=settings.businessCard;else $('businessCardPreview').removeAttribute('src')}
$('businessCardInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{if(!/^image\/(jpeg|png|webp)$/.test(f.type))throw Error('JPG, PNG, WEBP 파일만 가능합니다.');if(f.size>12*1024*1024)throw Error('명함 이미지 크기는 12MB 이하로 선택하세요.');const url=URL.createObjectURL(f);try{const img=await loadCardImage(url);const c=document.createElement('canvas');const scale=Math.min(1,1100/img.width,700/img.height);c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);settings.businessCard=c.toDataURL('image/jpeg',.8);if(!persist(SET,settings))throw Error('저장 공간이 부족합니다.');refreshCardPreview();toast('명함을 등록했습니다. 아래 저장 버튼도 눌러주세요.')}finally{URL.revokeObjectURL(url)}}catch(err){toast(err.message||'명함 등록 실패')}finally{e.target.value=''}};
$('removeBusinessCard').onclick=()=>{settings.businessCard='';persist(SET,settings);refreshCardPreview();toast('명함 이미지를 삭제했습니다.')};
function loadDesignControls(){
 $('watermarkEnabled').checked=settings.watermarkEnabled!==false;
 $('watermarkOpacity').value=settings.watermarkOpacity??12;
 $('watermarkSize').value=settings.watermarkSize||'large';
 $('watermarkPosition').value=settings.watermarkPosition||'center';
 $('showBusinessCard').checked=settings.showBusinessCard!==false;
 $('showWebsiteButton').checked=settings.showWebsiteButton!==false;
 $('websiteButtonLabel').value=settings.websiteButtonLabel||'홈페이지 바로가기';
 $('websiteButtonColor').value=settings.websiteButtonColor||'#153B62';
 $('includeStandardNotice').checked=settings.includeStandardNotice!==false;
 $('standardNotice').value=settings.standardNotice||'';
 updateDesignPreview();
}
function updateDesignPreview(){
 const enabled=$('watermarkEnabled').checked;
 $('watermarkOpacityLabel').textContent=$('watermarkOpacity').value+'%';
 const im=$('watermarkPreview');
 im.src=settings.companyLogo||'assets/cheongchun-logo.jpg';
 im.style.opacity=enabled?String(Number($('watermarkOpacity').value)/100):'0';
 im.style.width={small:'34%',medium:'49%',large:'65%'}[$('watermarkSize').value]||'65%';
 im.style.top={top:'22%',center:'50%',bottom:'77%'}[$('watermarkPosition').value]||'50%';
}
// v8: Manage cleaning zones and task details in Settings, using the existing template storage key.
let editingIndustry='';let workingScopeRows=[];
function parseScopeRows(value){return String(value||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean).map(v=>{const n=v.indexOf(' | ');return n>=0?{zone:v.slice(0,n).trim(),task:v.slice(n+3).trim()}:{zone:'공통',task:v}})}
function serializeScopeRows(rows){return rows.filter(r=>r.task.trim()).map(r=>(r.zone.trim()&&r.zone.trim()!=='공통'?r.zone.trim()+' | ':'')+r.task.trim()).join('\n')}
function refreshManageIndustries(preferred){const sel=$('manageIndustry');const chosen=preferred||editingIndustry||Object.keys(templates)[0];sel.replaceChildren();for(const name of Object.keys(templates)){const o=document.createElement('option');o.value=name;o.textContent=name;sel.append(o)}if(templates[chosen]!==undefined)sel.value=chosen;editingIndustry=sel.value;workingScopeRows=parseScopeRows(templates[editingIndustry]||'');renderManageRows()}
function renderManageRows(){const root=$('scopeManagerRows');root.replaceChildren();if(!workingScopeRows.length){const p=document.createElement('p');p.className='hint';p.textContent='등록된 작업 항목이 없습니다. 아래에서 추가하세요.';root.append(p)}workingScopeRows.forEach((item,i)=>{const row=document.createElement('div');row.className='scope-manage-row';const num=document.createElement('span');num.className='scope-index';num.textContent=String(i+1).padStart(2,'0');const zone=document.createElement('input');zone.placeholder='청소 구역';zone.value=item.zone;zone.setAttribute('aria-label','청소 구역 '+(i+1));zone.addEventListener('input',()=>item.zone=zone.value);const task=document.createElement('input');task.placeholder='세부 작업 내용';task.value=item.task;task.setAttribute('aria-label','작업 범위 '+(i+1));task.addEventListener('input',()=>item.task=task.value);const controls=document.createElement('div');controls.className='scope-row-controls';[['↑',()=>moveManageRow(i,-1)],['↓',()=>moveManageRow(i,1)],['삭제',()=>{workingScopeRows.splice(i,1);renderManageRows()}]].forEach(([label,fn])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className='secondary';b.onclick=fn;controls.append(b)});row.append(num,zone,task,controls);root.append(row)})}
function moveManageRow(i,delta){const j=i+delta;if(j<0||j>=workingScopeRows.length)return;[workingScopeRows[i],workingScopeRows[j]]=[workingScopeRows[j],workingScopeRows[i]];renderManageRows()}
function saveManagedTemplate(){if(!editingIndustry){toast('업종을 선택하세요.');return false}const bad=workingScopeRows.some(r=>!r.task.trim());if(bad){toast('작업 내용이 비어 있는 항목을 확인하세요.');return false}const next={...templates,[editingIndustry]:serializeScopeRows(workingScopeRows)};if(!persist(TPL,next))return false;templates=next;const selected=$('industry').value;initIndustry();if(templates[selected]!==undefined)$('industry').value=selected;refreshManageIndustries(editingIndustry);toast('작업 범위를 저장 요청했습니다. 서버 저장 상태를 확인하세요.');return true}
$('manageIndustry').addEventListener('change',()=>{editingIndustry=$('manageIndustry').value;workingScopeRows=parseScopeRows(templates[editingIndustry]||'');renderManageRows()});
$('addIndustry').onclick=()=>{const name=$('newIndustry').value.trim();if(!name){toast('새 업종 이름을 입력하세요.');return}if(templates[name]!==undefined){toast('이미 등록된 업종입니다.');return}const next={...templates,[name]:''};if(!persist(TPL,next))return;templates=next;$('newIndustry').value='';initIndustry();refreshManageIndustries(name);toast('업종을 추가했습니다.')};
$('deleteIndustry').onclick=()=>{if(Object.keys(templates).length<=1){toast('최소 한 개 업종은 유지해야 합니다.');return}if(!confirm('"'+editingIndustry+'" 업종 템플릿을 삭제할까요? 기존 저장된 견적서는 유지됩니다.'))return;const next={...templates};delete next[editingIndustry];if(!persist(TPL,next))return;templates=next;initIndustry();refreshManageIndustries();toast('업종 템플릿을 삭제했습니다.')};
$('addScopeRow').onclick=()=>{const zone=$('newScopeZone').value.trim(),task=$('newScopeTask').value.trim();if(!task){toast('세부 작업 범위를 입력하세요.');return}workingScopeRows.push({zone:zone||'공통',task});$('newScopeZone').value='';$('newScopeTask').value='';renderManageRows()};
$('saveManagedTemplate').onclick=saveManagedTemplate;
$('applyManagedTemplate').onclick=()=>{if(!saveManagedTemplate())return;$('industry').value=editingIndustry;updateIndustry();switchTab('editor');toast('현재 견적서에 청소 범위를 적용했습니다.')};
for(const id of ['watermarkEnabled','watermarkOpacity','watermarkSize','watermarkPosition'])$(id).addEventListener('input',updateDesignPreview);
$('date').value=new Date().toLocaleDateString('en-CA');initIndustry();refreshManageIndustries();for(const k of ['company','companyPhone','companyEmail','companyAddress','managerName','managerRole','website'])$(k).value=settings[k]||'';$('includeBusinessCard').checked=settings.includeBusinessCard!==false;loadDesignControls();refreshCardPreview();refreshCompanyLogoPreview();$('price').addEventListener('input',calculate);$('industry').addEventListener('change',updateIndustry);$('save').onclick=save;$('pdf').onclick=savePdf;$('share').onclick=share;$('saveTemplate').onclick=()=>{const next={...templates,[$('industry').value]:$('scope').value};if(persist(TPL,next)){templates=next;refreshManageIndustries($('industry').value);toast('청소범위 템플릿을 저장했습니다.')}};$('saveSettings').onclick=()=>{const next={...settings,...Object.fromEntries(['company','companyPhone','companyEmail','companyAddress','managerName','managerRole','website'].map(k=>[k,$(k).value.trim()])),includeBusinessCard:$('includeBusinessCard').checked,watermarkEnabled:$('watermarkEnabled').checked,watermarkOpacity:Number($('watermarkOpacity').value),watermarkSize:$('watermarkSize').value,watermarkPosition:$('watermarkPosition').value,showBusinessCard:$('showBusinessCard').checked,showWebsiteButton:$('showWebsiteButton').checked,websiteButtonLabel:$('websiteButtonLabel').value.trim()||'홈페이지 바로가기',websiteButtonColor:$('websiteButtonColor').value,includeStandardNotice:$('includeStandardNotice').checked,standardNotice:$('standardNotice').value.trim()};if(next.website&&!normalizeWebsite(next.website)){toast('홈페이지 주소를 확인하세요.');return}next.website=normalizeWebsite(next.website);settings=next;if(persist(SET,settings)){refreshCompanyBrand();toast('회사 정보를 저장 요청했습니다. 서버 저장 상태를 확인하세요.')}};document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));$('exportBackup').onclick=()=>{const file=new File([JSON.stringify({version:1,records,settings,templates},null,2)],'청춘클린랩_견적백업_'+new Date().toLocaleDateString('en-CA')+'.json',{type:'application/json'});download(file)};$('importBackup').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const o=JSON.parse(await f.text());if(!Array.isArray(o.records)||typeof o.templates!=='object')throw Error('형식 오류');if(!confirm('기존 견적 내역을 백업 파일로 교체할까요?'))return;records=o.records;templates=o.templates;settings=o.settings||settings;persist(KEY,records);persist(TPL,templates);persist(SET,settings);initIndustry();refreshManageIndustries();renderHistory();for(const k of ['company','companyPhone','companyEmail','companyAddress','managerName','managerRole','website'])$(k).value=settings[k]||'';$('includeBusinessCard').checked=settings.includeBusinessCard!==false;loadDesignControls();refreshCardPreview();refreshCompanyLogoPreview();toast('백업을 가져왔습니다.')}catch{toast('백업 파일 형식을 확인하세요.')}finally{e.target.value=''}};renderHistory();calculate();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('install').hidden=false});$('install').onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('install').hidden=true};

