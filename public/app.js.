(function () {
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var key = q.get('key') || localStorage.getItem('vr_key') || '';
  if (key) localStorage.setItem('vr_key', key);
  var alphas = [0.15, 0.35, 0.55, 0.8], ai = parseInt(localStorage.getItem('vr_ai') || '1', 10);
  function applyAlpha() { document.body.style.setProperty('--alpha', alphas[ai]); localStorage.setItem('vr_ai', ai); }
  applyAlpha();
  if (localStorage.getItem('vr_mini') === '1') document.body.classList.add('mini');
  if (localStorage.getItem('vr_hide') === '1') document.body.classList.add('hidelist');
  $('btnOpacity').onclick = function () { ai = (ai + 1) % alphas.length; applyAlpha(); };
  $('btnMini').onclick = function () { var on = document.body.classList.toggle('mini'); localStorage.setItem('vr_mini', on ? '1' : '0'); };
  $('btnList').onclick = function () { var on = document.body.classList.toggle('hidelist'); localStorage.setItem('vr_hide', on ? '1' : '0'); };
  var rows = {};
  function render(d) {
    $('title').textContent = d.channel;
    var list = $('list'), seen = {};
    d.members.forEach(function (m) {
      seen[m.id] = 1;
      var r = rows[m.id];
      if (!r) {
        r = rows[m.id] = document.createElement('div');
        r.innerHTML = '<img alt=""><span class="n"></span><span class="s"></span>';
        list.appendChild(r);
      }
      r.className = 'm' + (m.talking ? ' talk' : '');
      r.querySelector('img').src = m.avatar;
      r.querySelector('.n').textContent = m.name;
      r.querySelector('.s').textContent = m.deafened ? '\uD83D\uDD07' : (m.muted ? '\uD83C\uDF99\uFE0F\u2716' : '');
    });
    Object.keys(rows).forEach(function (id) { if (!seen[id]) { rows[id].remove(); delete rows[id]; } });
  }
  function connect() {
    var es = new EventSource('events?key=' + encodeURIComponent(key));
    es.onopen = function () { $('status').className = 'dot on'; document.body.classList.remove('nokey'); };
    es.onmessage = function (e) { render(JSON.parse(e.data)); };
    es.onerror = function () { $('status').className = 'dot off'; if (!key) document.body.classList.add('nokey'); es.close(); setTimeout(connect, 2000); };
  }
  connect();
})();
