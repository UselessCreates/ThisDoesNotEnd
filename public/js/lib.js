(function () {
  var SEEDS = [
    'Donald Trump', 'Abraham Lincoln', 'Napoleon', 'Cleopatra', 'Eiffel Tower', 'Titanic', 'Nikola Tesla',
    'Albert Einstein', 'Mount Everest', 'Octopus', 'Moon', 'Leonardo da Vinci', 'Winston Churchill',
    'Queen Victoria', 'Marie Curie', 'Charles Darwin', 'Thomas Edison', 'Great Wall of China', 'Colosseum',
    'Pyramids of Giza', 'Taj Mahal', 'Niagara Falls', 'Grand Canyon', 'Amazon rainforest', 'Sahara',
    'Elephant', 'Giraffe', 'Penguin', 'Owl', 'Honey bee', 'Blue whale', 'Tiger', 'Wolf', 'Peacock', 'Seahorse',
    'Mars', 'Jupiter', 'Saturn', 'Halley\'s Comet', 'Aurora', 'Volcano', 'Glacier', 'Lighthouse',
    'Steam locomotive', 'Zeppelin', 'Wright brothers', 'Telephone', 'Phonograph', 'Bicycle', 'Typewriter',
    'Paris', 'London', 'New York City', 'Venice', 'Istanbul', 'Tokyo', 'Cairo', 'Rome', 'Vienna', 'Prague',
    'Mona Lisa', 'Vincent van Gogh', 'Claude Monet', 'Pablo Picasso', 'Rembrandt', 'William Shakespeare',
    'Mark Twain', 'Charles Dickens', 'Jules Verne', 'Sherlock Holmes', 'Dracula', 'Beethoven', 'Mozart',
    'Piano', 'Elvis Presley', 'The Beatles', 'Charlie Chaplin', 'Muhammad Ali', 'Chess', 'Tea', 'Coffee',
    'Chocolate', 'Barack Obama', 'George Washington', 'Martin Luther King Jr.', 'Mahatma Gandhi',
    'Alexander the Great', 'Julius Caesar', 'Genghis Khan', 'Joan of Arc', 'Vikings', 'Samurai', 'Pirate',
    'Dinosaur', 'Mammoth', 'Dodo', 'Atlantis', 'Stonehenge', 'Machu Picchu', 'Statue of Liberty',
    'Golden Gate Bridge', 'Big Ben', 'Hot air balloon', 'Submarine', 'Tornado', 'Coral reef', 'Cat', 'Horse',
    'Sunflower', 'Mushroom', 'Cactus', 'Apollo 11', 'Neil Armstrong', 'Elon Musk', 'Steve Jobs'
  ];

  var SUBJECTS = ['love', 'war', 'ocean', 'history', 'travel', 'mystery', 'science', 'music', 'art', 'poetry',
    'cooking', 'gardening', 'space', 'animals', 'architecture', 'philosophy', 'sailing', 'mathematics',
    'folklore', 'medicine', 'railways', 'maps', 'theatre', 'chess', 'birds', 'insects', 'weather', 'ghosts',
    'kings', 'islands', 'mountains', 'clocks', 'dreams', 'law', 'money', 'fashion', 'sports', 'circus'];

  var LETTERS = 'abcdefghijklmnopqrstuvwxyz';

  function g(o, path) {
    return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o);
  }
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rand(arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function delay(ms, v) { return new Promise(function (r) { setTimeout(function () { r(v); }, ms); }); }

  function slugify(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function unslug(s) { return String(s).replace(/[-_+]+/g, ' ').trim(); }
  function titleCase(s) { return s.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }
  function clip(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '\u2026' : s; }
  function stripTags(s) { return String(s).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'"); }
  function safe(u) {
    if (typeof u !== 'string') return '';
    if (u.indexOf('//') === 0) u = 'https:' + u;
    return /^https?:\/\//i.test(u) ? u.replace(/^http:/i, 'https:') : '';
  }
  function cleanFile(t) {
    return clip(String(t).replace(/^File:/i, '').replace(/\.[a-z0-9]{3,4}$/i, '').replace(/_/g, ' '), 70);
  }

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === 'class') e.className = v; else e.setAttribute(k, v === true ? '' : v);
    });
    (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
    return e;
  }

  function qs(o) {
    return Object.keys(o).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&');
  }
  function getJSON(url, ms) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, ms || 8000);
    return fetch(url, { signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return null; })
      .then(function (d) { clearTimeout(timer); return d; });
  }
  function mw(host, params) {
    return getJSON('https://' + host + '/w/api.php?format=json&origin=*&' + qs(params));
  }

  function items(arr, key, src) {
    return (arr || []).map(function (x) {
      var t = key ? x[key] : x;
      return { t: typeof t === 'string' ? clip(stripTags(t), 70) : '', s: src };
    }).filter(function (x) { return x.t && slugify(x.t); });
  }

  function imageItems(d, width) {
    var pages = g(d, 'query.pages');
    if (!pages) return [];
    return Object.keys(pages).map(function (k) { return pages[k]; })
      .sort(function (a, b) { return (a.index || 0) - (b.index || 0); })
      .map(function (p) {
        var ii = p.imageinfo && p.imageinfo[0];
        if (!ii || !/^image\/(jpeg|png|gif|webp)$/.test(ii.mime || '')) return null;
        var img = safe(ii.thumburl || ii.url);
        if (!img) return null;
        return { t: cleanFile(p.title), img: img, page: safe(ii.descriptionurl) };
      }).filter(Boolean);
  }

  function pictures(q, width) {
    return mw('commons.wikimedia.org', {
      action: 'query', generator: 'search', gsrsearch: q, gsrnamespace: 6, gsrlimit: 16,
      prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: width || 320
    }).then(function (d) { return imageItems(d); });
  }

  var S = {
    wikiRandom: function () {
      return mw('en.wikipedia.org', { action: 'query', list: 'random', rnnamespace: 0, rnlimit: 16 })
        .then(function (d) { return items(g(d, 'query.random'), 'title'); });
    },
    wikiMore: function (t) {
      return mw('en.wikipedia.org', { action: 'query', list: 'search', srsearch: 'morelike:' + t, srlimit: 20 })
        .then(function (d) {
          var r = items(g(d, 'query.search'), 'title');
          if (r.length) return r;
          return mw('en.wikipedia.org', { action: 'query', list: 'search', srsearch: t, srlimit: 20 })
            .then(function (d2) { return items(g(d2, 'query.search'), 'title'); });
        });
    },
    wikiLinks: function (title) {
      return mw('en.wikipedia.org', { action: 'query', titles: title, prop: 'links', pllimit: 100, plnamespace: 0 })
        .then(function (d) {
          var pages = g(d, 'query.pages') || {};
          var all = [];
          Object.keys(pages).forEach(function (k) { all = all.concat(pages[k].links || []); });
          return items(all, 'title');
        });
    },
    words: function (t) {
      return getJSON('https://api.datamuse.com/words?ml=' + encodeURIComponent(t) + '&max=24')
        .then(function (d) { return items(d, 'word'); });
    },
    library: function (t) {
      return getJSON('https://openlibrary.org/search.json?limit=20&fields=title,author_name&q=' + encodeURIComponent(t))
        .then(function (d) {
          var out = [];
          (g(d, 'docs') || []).forEach(function (doc) {
            if (doc.author_name && doc.author_name[0]) out.push(doc.author_name[0]);
            if (doc.title) out.push(doc.title);
          });
          return items(out);
        });
    },
    quotes: function (t) {
      return mw('en.wikiquote.org', { action: 'query', list: 'search', srsearch: t, srlimit: 20 })
        .then(function (d) { return items(g(d, 'query.search'), 'title'); });
    },
    nasa: function (t) {
      return getJSON('https://images-api.nasa.gov/search?media_type=image&q=' + encodeURIComponent(t)).then(function (d) {
        var out = [];
        (g(d, 'collection.items') || []).forEach(function (it) {
          var kw = g(it, 'data.0.keywords') || [];
          out = out.concat(kw);
        });
        return items(shuffle(out).slice(0, 24));
      });
    },
    wiktRandom: function () {
      return mw('en.wiktionary.org', { action: 'query', list: 'random', rnnamespace: 0, rnlimit: 18 })
        .then(function (d) { return items(g(d, 'query.random'), 'title'); });
    },
    poems: function () {
      return getJSON('https://poetrydb.org/random/12/title,author').then(function (d) {
        var out = [];
        (d || []).forEach(function (p) { if (p.title) out.push(p.title); if (p.author) out.push(p.author); });
        return items(out);
      });
    },
    nature: function () {
      var q = pick(LETTERS.split('')) + pick(LETTERS.split(''));
      return getJSON('https://api.inaturalist.org/v1/taxa/autocomplete?per_page=16&q=' + q).then(function (d) {
        return items((g(d, 'results') || []).map(function (r) { return r.preferred_common_name || r.name; }));
      });
    },
    libRandom: function () {
      return getJSON('https://openlibrary.org/search.json?limit=16&fields=title,author_name&offset=' + (rand(20) * 16) +
        '&q=subject:' + encodeURIComponent(pick(SUBJECTS))).then(function (d) {
        var out = [];
        (g(d, 'docs') || []).forEach(function (doc) {
          if (doc.title) out.push(doc.title);
          if (doc.author_name && doc.author_name[0]) out.push(doc.author_name[0]);
        });
        return items(out);
      });
    },
    archiveRandom: function () {
      return getJSON('https://archive.org/advancedsearch.php?q=' + encodeURIComponent('subject:' + pick(SUBJECTS)) +
        '&fl%5B%5D=title&rows=16&output=json&page=' + (1 + rand(40))).then(function (d) {
        return items((g(d, 'response.docs') || []).map(function (x) { return Array.isArray(x.title) ? x.title[0] : x.title; }));
      });
    },
    pictures: function () {
      return mw('commons.wikimedia.org', {
        action: 'query', generator: 'random', grnnamespace: 6, grnlimit: 12,
        prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: 320
      }).then(function (d) { return imageItems(d); });
    },
    picturesFor: function (t) { return pictures(t, 320); }
  };

  var PLANS = [
    { label: 'related \u00b7 wikipedia', run: function (c) { return S.wikiMore(c.near()); } },
    { label: 'related \u00b7 words', run: function (c) { return S.words(c.near()); } },
    { label: 'related \u00b7 books & authors', run: function (c) { return S.library(c.near()); } },
    { label: 'related \u00b7 quotations', run: function (c) { return S.quotes(c.near()); } },
    { label: 'related \u00b7 space', run: function (c) { return S.nasa(c.near()); } },
    { label: 'related \u00b7 pictures', images: true, run: function (c) { return S.picturesFor(c.near()); } },
    { label: 'unrelated \u00b7 random wikipedia', run: S.wikiRandom },
    { label: 'unrelated \u00b7 dictionary', run: S.wiktRandom },
    { label: 'unrelated \u00b7 poems', run: S.poems },
    { label: 'unrelated \u00b7 living things', run: S.nature },
    { label: 'unrelated \u00b7 library shelves', run: S.libRandom },
    { label: 'unrelated \u00b7 the archive', run: S.archiveRandom },
    { label: 'unrelated \u00b7 pictures', images: true, run: S.pictures }
  ];

  function R() { return window.Wayfarer.rot; }

  function startFeed(root, opts) {
    opts = opts || {};
    var seen = {};
    var recent = [opts.title || pick(SEEDS)];
    var first = opts.first || [];
    var sentinel = h('p', { class: 'more' }, 'more \u2193');
    var busy = false;
    var lastPlan = -1;
    root.appendChild(sentinel);

    function near() { return pick(recent); }

    function fresh(list) {
      var out = [];
      (list || []).forEach(function (it) {
        var s = slugify(it.t);
        if (!s || seen[s]) return;
        seen[s] = true;
        out.push(it);
      });
      return out;
    }

    function render(label, list, images) {
      var batch = h('section', { class: 'batch' }, [h('h2', {}, R().text(label, 1.5))]);
      if (images) {
        batch.appendChild(h('div', { class: 'gallery' }, list.slice(0, 12).map(function (it) {
          return R().node(h('figure', {}, [
            h('a', { href: R().href(R().slug(slugify(it.t))) }, [R().image(h('img', { src: it.img, alt: it.t, loading: 'lazy' }))]),
            h('figcaption', {}, R().text(it.t))
          ]));
        })));
      } else {
        batch.appendChild(h('ul', {}, list.slice(0, 14).map(function (it) {
          return R().node(h('li', {}, [R().node(h('a', { href: R().href(R().slug(slugify(it.t))) }, R().text(it.t)))]));
        })));
      }
      R().extras(batch, list);
      root.insertBefore(batch, sentinel);
      R().batchDone();
      list.slice(0, 6).forEach(function (it) { recent.push(it.t); });
      if (recent.length > 40) recent = recent.slice(-40);
    }

    function loadBatch() {
      if (busy) return Promise.resolve();
      busy = true;
      var job;
      if (first.length) {
        var f = fresh(first);
        first = [];
        job = Promise.resolve(f.length ? { label: 'linked from this page', list: shuffle(f), images: false } : null);
      } else {
        job = Promise.resolve(null);
      }
      return job.then(function (got) {
        if (got) return got;
        var attempt = function (n) {
          if (n >= 4) return null;
          var idx;
          do { idx = rand(PLANS.length); } while (idx === lastPlan);
          lastPlan = idx;
          var plan = PLANS[idx];
          return Promise.resolve(plan.run({ near: near })).catch(function () { return []; }).then(function (list) {
            var f2 = fresh(list);
            if (f2.length >= (plan.images ? 3 : 4)) return { label: plan.label, list: f2, images: !!plan.images };
            return attempt(n + 1);
          });
        };
        return attempt(0);
      }).then(function (got) {
        if (!got) {
          var pool = fresh(shuffle(SEEDS).map(function (t) { return { t: t }; }));
          if (!pool.length) { seen = {}; pool = fresh(shuffle(SEEDS).map(function (t) { return { t: t }; })); }
          got = { label: 'unrelated \u00b7 from the index', list: pool, images: false };
        }
        render(got.label, got.list, got.images);
      }).catch(function () {}).then(function () { busy = false; });
    }

    function maybeLoad() {
      if (busy) return;
      if (sentinel.getBoundingClientRect().top < window.innerHeight * 2.5) {
        loadBatch().then(maybeLoad);
      }
    }

    window.addEventListener('scroll', maybeLoad, { passive: true });
    window.addEventListener('resize', maybeLoad);
    maybeLoad();
  }

  function randomTitle() {
    var plans = [S.wikiRandom, S.wiktRandom, S.poems, S.nature, S.libRandom];
    if (Math.random() < 0.35) return Promise.resolve(pick(SEEDS));
    return Promise.race([pick(plans)(), delay(2000, null)]).then(function (r) {
      return r && r.length ? pick(r).t : pick(SEEDS);
    }).catch(function () { return pick(SEEDS); });
  }

  window.Wayfarer = {
    SEEDS: SEEDS, g: g, h: h, slugify: slugify, unslug: unslug, titleCase: titleCase, clip: clip,
    stripTags: stripTags, safe: safe, getJSON: getJSON, mw: mw, S: S, pictures: pictures,
    startFeed: startFeed, randomTitle: randomTitle, delay: delay
  };
})();
