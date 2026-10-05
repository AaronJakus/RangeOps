/* RangeOps quick wins. Load this AFTER your main script:

   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
   <script src="app.js"></script>
   <script src="quick-wins.js"></script>

   It relies on globals from your main script: $, S, upd, done, doneT. */
(() => {
  const KEY = 'rangeops:v1';

  // 1. Saved progress ---------------------------------------------------
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ chk: [...done], rs: [...doneT], qz: S.qz }));
    } catch (e) {}
  }
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!d) return;
    const boxes = document.querySelectorAll('#list input');
    (d.chk || []).forEach(i => {
      if (boxes[i]) { boxes[i].checked = true; boxes[i].dispatchEvent(new Event('change')); }
    });
    (d.rs || []).forEach(k => doneT.add(k));
    S.rs = doneT.size;
    if (typeof d.qz === 'number') S.qz = d.qz;
    upd();
  }
  load();
  // Every click may have changed progress, so save right after it is handled.
  document.addEventListener('click', () => setTimeout(save, 0));
  window.resetProgress = () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };

  // 2. Breached-password check (Have I Been Pwned, k-anonymity) ----------
  // Only the first 5 characters of the SHA-1 hash leave the browser.
  const sha1 = async s =>
    [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)))]
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  async function breachCount(pw) {
    const h = await sha1(pw);
    const res = await fetch('https://api.pwnedpasswords.com/range/' + h.slice(0, 5));
    if (!res.ok) throw new Error('lookup failed');
    const hit = (await res.text()).split('\n').find(l => l.startsWith(h.slice(5)));
    return hit ? parseInt(hit.split(':')[1], 10) : 0;
  }

  const hib = $('hib');
  if (hib) hib.onclick = async () => {
    const v = $('pw').value, out = $('hibr');
    if (!v) { out.textContent = 'Type a password first.'; return; }
    out.style.color = ''; out.textContent = 'Checking...';
    try {
      const n = await breachCount(v);
      out.style.color = n ? 'var(--bad)' : 'var(--ok)';
      out.textContent = n
        ? 'Found in ' + n.toLocaleString() + ' known breaches. Never use this password.'
        : 'Not found in known breaches. That does not guarantee it is strong.';
    } catch (e) {
      out.style.color = 'var(--warn)';
      out.textContent = 'Could not reach the breach service. Try again later.';
    }
  };

  // 3. Suspicious link inspector -------------------------------------------
  const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'ow.ly', 'buff.ly'];
  function inspect(raw) {
    const f = [];
    let u;
    try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); }
    catch (e) { return ['That does not look like a valid URL.']; }
    const h = u.hostname.toLowerCase();
    if (u.protocol !== 'https:') f.push('Not using HTTPS.');
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) f.push('Uses a raw IP address instead of a domain name.');
    if (h.includes('xn--') || /[^\x00-\x7F]/.test(raw)) f.push('Possible lookalike characters (punycode or non-ASCII).');
    if (SHORTENERS.includes(h)) f.push('URL shortener: the real destination is hidden.');
    if (u.username) f.push('Contains a username before the host, which can disguise the real site.');
    if (h.split('.').length > 4) f.push('Many subdomains. Check the real domain at the end of the host name.');
    if (/(login|verify|secure|account|update|support)/.test(h)) f.push('Sensitive-sounding words in the domain name.');
    if (!f.length) f.push('No obvious red flags, but that does not prove the link is safe.');
    return f;
  }
  const lkb = $('lkb');
  if (lkb) lkb.onclick = () => {
    const ul = $('lkr');
    ul.innerHTML = '';
    inspect($('lk').value.trim()).forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
  };

  // 4. PDF certificate (needs the jsPDF script tag above) ---------------------
  window.certPDF = name => {
    const { jsPDF } = window.jspdf;
    const d = new jsPDF({ orientation: 'landscape' });
    d.setDrawColor(194, 65, 12); d.setLineWidth(2); d.rect(10, 10, 277, 190);
    d.setFontSize(30); d.text('Certificate of Security Awareness', 148.5, 60, { align: 'center' });
    d.setFontSize(16); d.text('Awarded to', 148.5, 90, { align: 'center' });
    d.setFontSize(28); d.text(name || 'Participant', 148.5, 112, { align: 'center' });
    d.setFontSize(12);
    d.text('RangeOps - Enter the range of opportunity', 148.5, 150, { align: 'center' });
    d.text(new Date().toLocaleDateString('en-CA'), 148.5, 165, { align: 'center' });
    d.save('RangeOps-certificate.pdf');
  };

})();
