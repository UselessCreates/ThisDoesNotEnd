(function () {
  var W = window.Wayfarer;
  var h = W.h;

  var parts = location.pathname.split('/').filter(Boolean);
  var batches = 0;

  var MARKS = ['\u0300', '\u0301', '\u0302', '\u0303', '\u0306', '\u0308', '\u030a', '\u030b', '\u030c',
    '\u0316', '\u0317', '\u0323', '\u0324', '\u0329', '\u032d', '\u0335', '\u0336', '\u0337', '\u0338'];
  var GLYPHS = '\u2588\u2593\u2592\u2591#@%&?\u00a7\u00b6\u2020\u2021\u00d8<>/\\|~^';
  var SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789-';
  var BAD_SLUGS = ['null', 'undefined', 'error', 'void', 'nothing', 'behind-you', 'stop', 'leave', 'help', 'x00',
    'no-exit', 'still-here', 'turn-back', 'not-found', 'segment-overflow'];
  var WHISPERS = [
    'the index has no record of this page',
    'you were not supposed to scroll this far',
    'this page was never printed',
    'turn back',
    'someone else was here',
    'the links are not links anymore',
    'nobody is maintaining this',
    'page not found (page not found)',
    'ERROR: segment overflow',
    'where do you think this goes',
    'the path is longer than the site',
    'it remembers every address you passed through'
  ];
  var BOX = ['r-skew', 'r-flip', 'r-blur', 'r-shake', 'r-fade', 'r-shift', 'r-big', 'r-tiny', 'r-strike'];
  var PICS = ['r-invert', 'r-hue', 'r-dark', 'r-mono', 'r-flip', 'r-blur', 'r-skew'];

  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rand(a.length)]; }

  function level() { return Math.min(0.97, Math.max(0, (parts.length - 1) * 0.1 + batches * 0.015)); }

  function zalgo(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += pick(MARKS);
    return s;
  }

  function text(s, k) {
    var p = level() * (k == null ? 1 : k) * 0.12;
    if (p <= 0.005) return s;
    return Array.from(String(s)).map(function (c) {
      if (/\s/.test(c) || Math.random() > p) return c;
      var r = Math.random();
      if (r < 0.35) return c + zalgo(1 + rand(1 + Math.floor(level() * 6)));
      if (r < 0.6) return GLYPHS.charAt(rand(GLYPHS.length));
      if (r < 0.75) return '';
      if (r < 0.9) return c + c;
      return c.toUpperCase() === c ? c.toLowerCase() : c.toUpperCase();
    }).join('');
  }

  function gibberish(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += SLUG_CHARS.charAt(rand(SLUG_CHARS.length - 1));
    return s;
  }

  function slug(s) {
    var L = level();
    if (L < 0.15 || Math.random() > L * 0.7) return s;
    var r = Math.random();
    if (L > 0.5 && r < 0.15) return pick(BAD_SLUGS);
    if (L > 0.6 && r < 0.3) return gibberish(4 + rand(10));
    var a = s.split('');
    var n = 1 + rand(Math.ceil(L * 4));
    for (var i = 0; i < n && a.length; i++) {
      var at = rand(a.length);
      var op = rand(4);
      if (op === 0) a[at] = SLUG_CHARS.charAt(rand(SLUG_CHARS.length));
      else if (op === 1) a.splice(at, 1);
      else if (op === 2) a.splice(at, 0, a[at]);
      else if (at < a.length - 1) { var t = a[at]; a[at] = a[at + 1]; a[at + 1] = t; }
    }
    return a.join('').replace(/^-+|-+$/g, '') || 'void';
  }

  function href(s) {
    var segs = parts.concat([s]);
    var p = '/' + segs.join('/');
    while (p.length > 1600 && segs.length > 2) { segs.shift(); p = '/' + segs.join('/'); }
    return p;
  }

  function parentHref() { return parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/'; }

  function node(el, bias) {
    if (Math.random() < level() * 0.22 * (bias || 1)) el.classList.add(pick(BOX));
    return el;
  }

  function image(img) {
    if (Math.random() < level() * 0.6) img.classList.add(pick(PICS));
    return img;
  }

  function syncBody() {
    var L = level();
    document.body.classList.toggle('rot-1', L > 0.4);
    document.body.classList.toggle('rot-2', L > 0.7);
  }

  function batchDone() { batches++; syncBody(); }

  function whisper() {
    var L = level();
    if (L < 0.3 || Math.random() > L * 0.5) return null;
    var line = Math.random() < 0.2 ? 'depth ' + parts.length : pick(WHISPERS);
    return h('p', { class: 'whisper' }, text(line, 1.5));
  }

  function extras(batch, list) {
    var w = whisper();
    if (w) batch.appendChild(w);
    if (Math.random() > 0.4) return;
    var kinds = parts.length > 1 ? ['go', 'back', 'home', 'random'] : ['go', 'home', 'random'];
    var kind = pick(kinds);
    var labels = {
      go: pick(['keep going', 'go somewhere', 'continue', 'open one', 'enter']),
      back: 'go back',
      home: 'go home',
      random: pick(['surprise me', 'random', 'somewhere else'])
    };
    var b = h('button', { type: 'button' }, text(labels[kind], 1.5));
    var L = level();
    b.addEventListener('click', function () {
      var k = kind;
      if (Math.random() < L * 0.7) k = pick(['go', 'go', 'random']);
      if (k === 'back') location.href = parentHref();
      else if (k === 'home') location.href = '/';
      else if (k === 'go' && list.length) location.href = href(slug(W.slugify(pick(list).t)));
      else W.randomTitle().then(function (t) { location.href = href(W.slugify(t) || 'void'); });
    });
    batch.appendChild(h('p', {}, [node(b, 2)]));
  }

  function glitchTick() {
    var L = level();
    if (L < 0.2 || Math.random() > L) return;
    var pool = document.querySelectorAll('main a, main h1, main h2, main p, main li, main button, nav a, nav button, figcaption, main img');
    if (!pool.length) return;
    var el = pool[rand(pool.length)];
    var r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    if (el.tagName === 'IMG') {
      el.classList.add('r-flash');
      setTimeout(function () { el.classList.remove('r-flash'); }, 180);
      return;
    }
    if (el.children.length || el.dataset.rotting) return;
    var orig = el.textContent;
    if (!orig) return;
    el.dataset.rotting = '1';
    el.textContent = text(orig, 4);
    var permanent = L > 0.6 && Math.random() < 0.25;
    setTimeout(function () {
      if (!permanent) el.textContent = orig;
      delete el.dataset.rotting;
    }, 120 + rand(400));
    if (L > 0.5 && Math.random() < L * 0.08) {
      document.body.classList.add('r-tear');
      setTimeout(function () { document.body.classList.remove('r-tear'); }, 160);
    }
    if (L > 0.7 && Math.random() < 0.1) document.title = text(document.title, 3);
  }

  function start() {
    syncBody();
    setInterval(glitchTick, 700);
  }

  W.rot = {
    level: level, depth: function () { return parts.length; }, text: text, slug: slug, href: href,
    parentHref: parentHref, node: node, image: image, extras: extras, batchDone: batchDone, start: start,
    pick: pick, lie: function () { return Math.random() < level() * 0.6; }
  };
})();
