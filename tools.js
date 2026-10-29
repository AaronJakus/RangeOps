/* RangeOps tools: spam checker, VirusTotal lookup, email header analyzer, project and security pages.
   Load AFTER app.js. Uses the $ helper defined in app.js. */
(() => {
const VT_API = ''; // Set to your Worker URL (see worker.js) to show live VirusTotal verdicts
// Security tools
const BR=['paypal','microsoft','google','amazon','apple','netflix','facebook','fedex','dhl','canadapost','scotiabank','desjardins','interac','docusign','dropbox','linkedin'];
const TLD=/\.(top|xyz|click|icu|tk|gq|ml|cf|work|support|zip|mov|rest)$/i,SHORT=/^(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|cutt\.ly|rb\.gy|buff\.ly)$/i;
const TX=[[/\b(urgent|immediately|act now|final notice|last chance|asap)\b|within \d+ ?(hours?|hrs|minutes)|expires? (today|soon|in)/i,2,'Urgency language','Pressure to act fast is the most common social-engineering lever.'],
[/\b(verify|confirm|update|validate)\b.{0,30}(account|password|identity|details|billing|payment)|password (expires|has expired)|log ?in to (continue|avoid)/i,3,'Credential request','Legitimate companies rarely ask you to verify credentials through a message.'],
[/gift ?cards?|wire transfer|bitcoin|\bcrypto(currency)?\b|western union|e-?transfer/i,3,'Unusual payment method','Gift cards, crypto and wires are hard to reverse, so scammers prefer them.'],
[/keep (this|it) (quiet|between us|confidential)|don.t tell|do not tell/i,2,'Secrecy request','Asking you to hide the request stops you from verifying it.'],
[/you.ve (won|been selected)|you have (won|been selected)|\blottery\b|inheritance|claim your|free (gift|iphone|money)/i,3,'Too-good-to-be-true offer','Prizes you never entered for are a classic lure.'],
[/\b(suspend\w*|locked|terminated|legal action|arrest\w*|penalt\w*)\b/i,2,'Threat of consequences','Fear of losing access or facing penalties is used to rush you.'],
[/dear (customer|user|client|member|valued)/i,1,'Generic greeting','Bulk senders often don’t know your name.'],
[/\.(zip|exe|scr|js|iso|html?|docm|xlsm|rar|7z)\b|enable (macros|content)/i,3,'Risky attachment lure','These file types commonly deliver malware.'],
[/!{2,}/,1,'Excessive punctuation','Repeated exclamation marks are typical of bulk spam.']];
function brandHit(h){const n=h.replace(/0/g,'o').replace(/1/g,'l').replace(/3/g,'e').replace(/5/g,'s').replace(/rn/g,'m').replace(/vv/g,'w');return BR.find(b=>n.split(/[.-]/).some(t=>t.startsWith(b))&&!new RegExp('(^|\\.)'+b+'\\.(com|ca|me|co\\.uk)$').test(h))}
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const vt=(k,v)=>'https://www.virustotal.com/gui/'+k+'/'+v;
function lnk(u){const a=mk('a','Open in VirusTotal','li');a.href=u;a.target='_blank';a.rel='noopener';return a}
function runSpam(){
 const t=$('sp').value,s=$('sf').value.trim(),H=[],r=$('sr');let sc=0;r.innerHTML='';
 if(!t.trim()){r.textContent='Paste a message first.';r.className='mut';return}r.className='';
 const add=(w,n,d)=>{H.push([w,n,d]);sc+=w};
 TX.forEach(x=>{if(x[0].test(t))add(x[1],x[2],x[3])});
 const L=t.replace(/[^A-Za-z]/g,'').length;if(L>25&&t.replace(/[^A-Z]/g,'').length/L>.4)add(1,'Shouting in capitals','Excessive capitals are common in bulk spam.');
 const U=[...new Set((t.match(/\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|net|org|io|ca|info|biz|co|top|xyz|click|icu|support|work|zip|ru|cn|tk|ml|gq|cf|ly|me|gl)\b(?:\/[^\s<>"')]*)?/gi)||[]).map(u=>u.replace(/[.,;:!?]+$/,'')))];
 U.forEach(u=>{try{const h=new URL(/^https?:/i.test(u)?u:'http://'+u).hostname.toLowerCase();
  if(/^\d+(\.\d+){3}$/.test(h)){add(3,'IP address link',h+' is a raw IP instead of a domain name.');return}
  if(SHORT.test(h))add(2,'Shortened link',h+' hides the real destination.');
  if(h.includes('xn--'))add(3,'Punycode domain',h+' may imitate another site with look-alike characters.');
  if(TLD.test(h))add(2,'High-abuse domain ending',h+' uses an ending often seen on throwaway domains.');
  const b=brandHit(h);if(b)add(3,'Look-alike of '+b,h+' imitates '+b+' but is not its real domain.')}catch(e){}});
 if(s){const d=s.split('@').pop().replace(/[>\s]/g,'').toLowerCase(),b=brandHit(d);if(b)add(3,'Look-alike sender',d+' imitates '+b+'.');
  if(/@(gmail|outlook|hotmail|yahoo|aol|icloud|proton(mail)?)\./i.test(s)&&/\b(ceo|hr|payroll|bank|support|helpdesk|invoice)\b/i.test(t))add(2,'Authority from a free mailbox','Organizations rarely send official requests from free webmail.')}
 const v=sc<3?['Low risk','var(--ok)']:sc<7?['Suspicious','var(--warn)']:['High risk','var(--bad)'];
 const h3=mk('h3',v[0]+' · score '+sc);h3.style.cssText='margin:16px 0 0;color:'+v[1];r.appendChild(h3);
 const bar=mk('div',null,'bar'),i=mk('i');i.style.width=Math.min(100,sc*10)+'%';i.style.background=v[1];bar.appendChild(i);r.appendChild(bar);
 if(!H.length)r.appendChild(mk('p','No warning signs matched. That doesn’t guarantee the message is safe, so still verify unexpected requests another way.','mut'));
 H.forEach(x=>{const d=mk('div',null,'hit'),a=mk('span');a.append(mk('b',x[1]),' · '+x[2]);d.append(a,mk('span','+'+x[0],'mut'));r.appendChild(d)});
 if(U.length){const p=mk('p');p.style.marginBottom='0';p.appendChild(mk('b','Links found, defanged so they can’t be clicked by accident'));r.appendChild(p);
  U.forEach(u=>{const d=mk('div',null,'hit');d.append(mk('code',u.replace(/^http/i,'hxxp').replace(/\./g,'[.]')),lnk(vt('search',encodeURIComponent(u))));r.appendChild(d)})}
 r.appendChild(mk('p','Rule-based check only, so treat it as a second opinion.','mut'))}
$('sgo').onclick=runSpam;
$('s1').onclick=()=>{$('sf').value='support@paypa1-alerts.com';$('sp').value='URGENT: your account is locked! Verify your password within 24 hours at https://secure-paypa1-login.com/verify or it will be suspended. Do not tell anyone.';runSpam()};
$('s2').onclick=()=>{$('sf').value='hr@yourcompany.com';$('sp').value='Hi team, the staff meeting is moved to 3pm Thursday. Same room as usual. See you there.';runSpam()};
function vtU(v){const x=v.replace(/^hxxp/i,'http').replace(/\[\.\]/g,'.');
 if(/^([a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})$/i.test(x))return['File hash',vt('file',x.toLowerCase())];
 if(/^\d{1,3}(\.\d{1,3}){3}$/.test(x))return['IP address',vt('ip-address',x)];
 if(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(x))return['Domain',vt('domain',x.toLowerCase())];
 if(/^(https?:\/\/)?[^\s]+\.[^\s]+$/i.test(x))return['URL',vt('search',encodeURIComponent(x))];return null}
$('vgo').onclick=()=>{const o=$('vr');o.innerHTML='';const r=vtU($('vi').value.trim());
 if(!r){o.textContent='Enter a URL, domain, IP address or MD5/SHA-1/SHA-256 hash.';o.className='mut';return}
 o.className='';o.append(mk('b','Detected: '+r[0]),mk('br'),lnk(r[1]));if(VT_API)vtLive(r[0],$('vi').value.trim(),o)};
$('vi').onkeydown=e=>{if(e.key==='Enter')$('vgo').click()};
async function hashFile(f){const o=$('vr');o.className='';o.innerHTML='';
 if(f.size>2e8){o.textContent='That file is over 200 MB, too large to hash in the browser. Hash it locally and paste the hash above.';return}
 o.textContent='Hashing '+f.name+'…';
 try{const d=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());const h=[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
  o.innerHTML='';const bx=mk('div',null,'msg');bx.append(mk('b',f.name),mk('small','Size: '+(f.size/1024).toFixed(1)+' KB · Type: '+(f.type||'unknown')));
  const g=mk('div',h,'gen');g.style.fontSize='13px';bx.appendChild(g);
  if(/\.(pdf|docx?|xlsx?|jpe?g|png|txt)\.(exe|scr|js|bat|cmd|lnk|vbs)$/i.test(f.name)){const w=mk('p','Warning: double file extension, a common malware trick.');w.style.color='var(--bad)';bx.appendChild(w)}
  else if(/\.(exe|scr|bat|cmd|js|vbs|ps1|msi|jar|iso|lnk|hta|dll|docm|xlsm)$/i.test(f.name))bx.appendChild(mk('p','This file type can run code. Be careful opening it.','mut'));
  bx.append(lnk(vt('file',h)),mk('p','Hashed locally with SHA-256. The file was never uploaded.','mut'));o.appendChild(bx);if(VT_API)vtLive('File hash',h,bx)}catch(e){o.textContent='Could not hash that file in this browser.'}}
$('vf').onchange=e=>{if(e.target.files[0])hashFile(e.target.files[0])};
const dz=$('dz');dz.ondragover=e=>{e.preventDefault();dz.classList.add('on')};dz.ondragleave=()=>dz.classList.remove('on');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('on');const f=e.dataTransfer.files[0];if(f)hashFile(f)};
// Live VirusTotal results (needs the Worker in worker.js and a host that allows requests to it)
async function vtLive(label,v,box){
 const k={'File hash':'file','IP address':'ip',Domain:'domain',URL:'url'}[label],p=mk('p','Checking VirusTotal…','mut');box.appendChild(p);
 try{const r=await fetch(VT_API+'/vt?type='+k+'&q='+encodeURIComponent(v.replace(/^hxxp/i,'http').replace(/\[\.\]/g,'.')));const d=await r.json();
  if(d.found===false){p.textContent='VirusTotal has no record of this yet. That is not proof it is safe.';return}
  if(!r.ok)throw 0;
  const s=d.stats||{},m=s.malicious||0,w=s.suspicious||0,n=m+w+(s.harmless||0)+(s.undetected||0);
  p.textContent=(m+w)+' of '+n+' engines flag this as malicious or suspicious.';p.style.cssText='font-weight:600;color:'+(m?'var(--bad)':w?'var(--warn)':'var(--ok)')}
 catch(e){p.textContent='Live lookup unavailable, so use the report link instead.'}}
// Email header analyzer
const priv=ip=>/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(ip);
function runHdr(){
 const raw=$('hd').value,r=$('hr');r.innerHTML='';
 if(!raw.trim()){r.textContent='Paste the full message headers first.';r.className='mut';return}r.className='';
 const P=raw.replace(/\r?\n[ \t]+/g,' ').split(/\r?\n/).map(l=>{const m=l.match(/^([A-Za-z-]+):\s*(.*)$/);return m?[m[1].toLowerCase(),m[2]]:null}).filter(Boolean);
 const g=n=>P.filter(x=>x[0]===n).map(x=>x[1]),f1=n=>g(n)[0]||'';
 const dom=s=>((s.match(/@([a-z0-9.-]+\.[a-z]{2,})/i)||[])[1]||'').toLowerCase();
 const same=(a,b)=>a===b||a.endsWith('.'+b)||b.endsWith('.'+a);
 const A={};[...g('authentication-results').join(' ').matchAll(/\b(spf|dkim|dmarc)=(\w+)/gi)].forEach(m=>{const k=m[1].toLowerCase();if(!A[k])A[k]=m[2].toLowerCase()});
 if(!A.spf){const m=f1('received-spf').match(/^(\w+)/);if(m)A.spf=m[1].toLowerCase()}
 const rows=[];let sc=0;const row=(l,v,lv,w)=>{rows.push([l,v,lv]);sc+=w||0};
 [['SPF','spf'],['DKIM','dkim'],['DMARC','dmarc']].forEach(([l,k])=>{const v=A[k];v==='pass'?row(l,'pass',0):!v?row(l,'not found',1,1):/fail|error/.test(v)?row(l,v,2,3):row(l,v,1,1)});
 const fd=dom(f1('from')),rp=dom(f1('return-path')),rt=dom(f1('reply-to'));
 if(!fd)row('From','missing or unreadable',1,1);else{const b=brandHit(fd);b?row('From domain',fd+' imitates '+b,2,3):row('From domain',fd,0);
  if(rp&&!same(fd,rp))row('Return-Path',rp+' differs from From',1,1);
  if(rt&&!same(fd,rt))row('Reply-To',rt+' differs from From',2,2)}
 const H=g('received').map(v=>({f:(v.match(/from\s+(\S+)/i)||[])[1],b:(v.match(/by\s+(\S+)/i)||[])[1],ip:[...v.matchAll(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/g)].map(m=>m[1]).find(x=>!priv(x))})).reverse();
 const v=sc<2?['Headers look consistent','var(--ok)']:sc<5?['Some warning signs','var(--warn)']:['Likely spoofed or forged','var(--bad)'];
 const h3=mk('h3',v[0]+' · score '+sc);h3.style.cssText='margin:16px 0 0;color:'+v[1];r.appendChild(h3);
 const bar=mk('div',null,'bar'),i=mk('i');i.style.width=Math.min(100,sc*10)+'%';i.style.background=v[1];bar.appendChild(i);r.appendChild(bar);
 rows.forEach(x=>{const d=mk('div',null,'hit'),s=mk('span',x[1]);s.style.cssText='font-weight:600;color:'+['var(--ok)','var(--warn)','var(--bad)'][x[2]];d.append(mk('b',x[0]),s);r.appendChild(d)});
 if(H.length){const p=mk('p');p.style.marginBottom='0';p.appendChild(mk('b','Delivery path, oldest hop first'));r.appendChild(p);
  H.forEach((h,n)=>{const d=mk('div',null,'hit');d.appendChild(mk('span',(n+1)+'. '+(h.f||'?')+' → '+(h.b||'?')+(h.ip?' ['+h.ip+']':'')));if(h.ip)d.appendChild(lnk(vt('ip-address',h.ip)));r.appendChild(d)})}
 r.appendChild(mk('p','Only the top hops, added by your own mail provider, are reliable. Lower hops can be forged by the sender.','mut'))}
$('hgo').onclick=runHdr;
$('hsm').onclick=()=>{$('hd').value=['Received: from relay.example.net ([10.0.0.5]) by mx.google.com with ESMTP; Tue, 27 Oct 2026 09:14:03 -0400','Received: from mail.evil-host.ru ([203.0.113.45]) by relay.example.net; Tue, 27 Oct 2026 09:14:01 -0400','Authentication-Results: mx.google.com; spf=fail smtp.mailfrom=paypa1-alerts.com; dkim=none; dmarc=fail header.from=paypa1-alerts.com','From: PayPal Support <support@paypa1-alerts.com>','Return-Path: <bounce@evil-host.ru>','Reply-To: <collect@free-mail-drop.com>','Subject: Action required'].join('\n');runHdr()};
// Project and security pages
[['Networking','Aaron, Brandon, Tyirell, John'],['Cybersecurity, SIEM, Zero Trust','Aaron'],['Active Directory, Microsoft 365','Brandon'],['Cloud (AWS and cloud computing)','Brandon, John'],['Virtualization, hardware, PowerShell','Tyirell'],['System administration, databases','John']].forEach(x=>{const d=mk('div',null,'hit');d.append(mk('b',x[0]),mk('span',x[1],'mut'));$('sk').appendChild(d)});
[['Content-Security-Policy','Scripts allowed only by hash; no framing, plugins or form posts'],['Strict-Transport-Security','Browsers use HTTPS only, for two years'],['X-Content-Type-Options','nosniff stops MIME-type guessing'],['Referrer-Policy','no-referrer keeps URLs from leaking to other sites'],['Permissions-Policy','Camera, microphone, location and more switched off'],['Cross-Origin-Opener-Policy','same-origin isolates the page from other windows'],['Cross-Origin-Resource-Policy','same-origin stops other sites embedding its files']].forEach(x=>{const d=mk('div',null,'hit');d.append(mk('code',x[0]),mk('span',x[1],'mut'));$('hdrs').appendChild(d)});
const STXT=['Contact: mailto:security@example.com','Expires: 2027-06-30T23:59:59Z','Preferred-Languages: en','Canonical: https://your-site.pages.dev/.well-known/security.txt','Policy: https://your-site.pages.dev/#/security'].join('\n');
$('stx').textContent=STXT;
$('scp').onclick=async()=>{try{await navigator.clipboard.writeText(STXT);$('scp').textContent='Copied'}catch(e){$('scp').textContent='Copy blocked'}setTimeout(()=>$('scp').textContent='Copy security.txt',1500)};

// Print and PDF buttons without inline onclick handlers (keeps the CSP strict)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  if (b.dataset.act === 'print') doPrint(b);
  if (b.dataset.act === 'pdf') certPDF(($('nm') || {}).value);
});
})();
