(function () {
  var W = window.Wayfarer;
  var R = W.rot;
  var h = W.h, g = W.g, safe = W.safe;

  var segments = location.pathname.split('/').filter(Boolean);
  var slug = segments[segments.length - 1] || '';
  try { slug = decodeURIComponent(slug); } catch (e) { /* keep raw */ }
  var q = W.unslug(slug) || 'nothing';
  var state = { title: W.titleCase(q), links: [] };

  var root = document.getElementById('root');
  var head = h('h1', {}, R.text(state.title, 1.5));
  document.title = head.textContent;
  root.appendChild(head);

  function ext(href, text, cls) {
    return h('a', { href: href, target: '_blank', rel: 'noopener noreferrer', class: cls }, text);
  }

  function gallery(list) {
    return h('div', { class: 'gallery' }, list.map(function (it) {
      var fig = h('figure', {}, [
        R.image(h('img', { src: it.img, alt: it.t, loading: 'lazy' })),
        h('figcaption', {}, R.text(it.t))
      ]);
      if (!it.href) return fig;
      return ext(it.href, [fig], 'tile');
    }));
  }

  function wikipedia(box) {
    return W.mw('en.wikipedia.org', {
      action: 'query', generator: 'search', gsrsearch: q, gsrlimit: 1, prop: 'extracts|pageimages|info',
      exintro: 1, explaintext: 1, exsentences: 8, piprop: 'thumbnail', pithumbsize: 700, inprop: 'url'
    }).then(function (d) {
      var pages = g(d, 'query.pages');
      var p = pages && pages[Object.keys(pages)[0]];
      if (!p) return false;
      state.title = p.title;
      head.textContent = R.text(p.title, 1.5);
      document.title = head.textContent;
      var thumb = p.thumbnail && safe(p.thumbnail.source);
      if (thumb) box.appendChild(R.image(h('img', { class: 'lead', src: thumb, alt: p.title })));
      (p.extract || '').split('\n').filter(Boolean).slice(0, 4).forEach(function (par) {
        box.appendChild(R.node(h('p', {}, R.text(par))));
      });
      if (safe(p.fullurl)) box.appendChild(h('p', { class: 'src' }, [ext(safe(p.fullurl), 'continue reading at wikipedia \u2197')]));
      return W.S.wikiLinks(p.title).then(function (links) {
        state.links = links;
        return !!(p.extract || thumb);
      });
    });
  }

  function commons(box) {
    return W.mw('commons.wikimedia.org', {
      action: 'query', generator: 'search', gsrsearch: q, gsrnamespace: 6, gsrlimit: 24,
      prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: 500
    }).then(function (d) {
      var pages = g(d, 'query.pages');
      if (!pages) return false;
      var list = Object.keys(pages).map(function (k) { return pages[k]; })
        .sort(function (a, b) { return (a.index || 0) - (b.index || 0); })
        .map(function (p) {
          var ii = p.imageinfo && p.imageinfo[0];
          if (!ii || !/^image\/(jpeg|png|gif|webp)$/.test(ii.mime || '')) return null;
          return { t: W.clip(p.title.replace(/^File:/i, '').replace(/\.[a-z0-9]{3,4}$/i, '').replace(/_/g, ' '), 70), img: safe(ii.thumburl || ii.url), href: safe(ii.descriptionurl) };
        }).filter(function (x) { return x && x.img; });
      if (!list.length) return false;
      box.appendChild(gallery(list));
      return true;
    });
  }

  function definition(box) {
    if (/\s/.test(q)) return Promise.resolve(false);
    return W.getJSON('https://api.datamuse.com/words?md=d&max=1&sp=' + encodeURIComponent(q)).then(function (d) {
      var e = d && d[0];
      if (!e || e.word.toLowerCase() !== q.toLowerCase() || !e.defs || !e.defs.length) return false;
      box.appendChild(h('ol', {}, e.defs.slice(0, 4).map(function (def) {
        return h('li', {}, def.replace(/^\w+\t/, '(' + def.split('\t')[0] + ') '));
      })));
      return true;
    });
  }

  function books(box) {
    return W.getJSON('https://openlibrary.org/search.json?limit=10&fields=key,title,author_name,cover_i,first_publish_year&q=' + encodeURIComponent(q))
      .then(function (d) {
        var docs = g(d, 'docs') || [];
        var list = docs.filter(function (b) { return b.title && b.key; }).map(function (b) {
          return {
            t: W.clip(b.title + (b.author_name ? ' \u2014 ' + b.author_name[0] : ''), 80),
            img: b.cover_i ? 'https://covers.openlibrary.org/b/id/' + encodeURIComponent(b.cover_i) + '-M.jpg' : '',
            href: 'https://openlibrary.org' + b.key
          };
        });
        if (!list.length) return false;
        var withCovers = list.filter(function (b) { return b.img; });
        if (withCovers.length >= 3) box.appendChild(gallery(withCovers));
        box.appendChild(h('ul', {}, list.map(function (b) { return h('li', {}, [ext(b.href, b.t)]); })));
        return true;
      });
  }

  function archive(box) {
    return W.getJSON('https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
      '&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=mediatype&rows=12&output=json&sort%5B%5D=downloads+desc')
      .then(function (d) {
        var list = (g(d, 'response.docs') || []).filter(function (x) { return x.identifier && x.title; }).map(function (x) {
          var title = Array.isArray(x.title) ? x.title[0] : x.title;
          return {
            t: W.clip(title + ' (' + x.mediatype + ')', 70),
            img: 'https://archive.org/services/img/' + encodeURIComponent(x.identifier),
            href: 'https://archive.org/details/' + encodeURIComponent(x.identifier)
          };
        });
        if (!list.length) return false;
        box.appendChild(gallery(list));
        return true;
      });
  }

  function loc(box) {
    return W.getJSON('https://www.loc.gov/photos/?fo=json&c=12&q=' + encodeURIComponent(q)).then(function (d) {
      var list = (g(d, 'results') || []).map(function (r) {
        var img = safe(r.image_url && r.image_url[0]);
        return img && r.title ? { t: W.clip(r.title, 70), img: img, href: safe(r.url || r.id) } : null;
      }).filter(Boolean);
      if (!list.length) return false;
      box.appendChild(gallery(list));
      return true;
    });
  }

  function nasa(box) {
    return W.getJSON('https://images-api.nasa.gov/search?media_type=image&page_size=12&q=' + encodeURIComponent(q)).then(function (d) {
      var list = (g(d, 'collection.items') || []).map(function (it) {
        var data = it.data && it.data[0];
        var img = safe(it.links && it.links[0] && it.links[0].href);
        if (!data || !img) return null;
        return { t: W.clip(data.title, 70), img: img, href: 'https://images.nasa.gov/details/' + encodeURIComponent(data.nasa_id) };
      }).filter(Boolean).slice(0, 12);
      if (!list.length) return false;
      box.appendChild(gallery(list));
      return true;
    });
  }

  function nature(box) {
    return W.getJSON('https://api.inaturalist.org/v1/taxa/autocomplete?per_page=8&q=' + encodeURIComponent(q)).then(function (d) {
      var list = (g(d, 'results') || []).map(function (r) {
        var img = safe(r.default_photo && r.default_photo.medium_url);
        if (!img) return null;
        return { t: W.clip(r.preferred_common_name ? r.preferred_common_name + ' (' + r.name + ')' : r.name, 70), img: img, href: 'https://www.inaturalist.org/taxa/' + encodeURIComponent(r.id) };
      }).filter(Boolean);
      if (!list.length) return false;
      box.appendChild(gallery(list));
      return true;
    });
  }

  function quotes(box) {
    return W.mw('en.wikiquote.org', { action: 'query', list: 'search', srsearch: q, srlimit: 6 }).then(function (d) {
      var hits = g(d, 'query.search') || [];
      if (!hits.length) return false;
      box.appendChild(h('ul', { class: 'plain' }, hits.map(function (x) {
        return h('li', {}, [
          ext('https://en.wikiquote.org/wiki/' + encodeURIComponent(x.title.replace(/ /g, '_')), x.title),
          h('span', { class: 'snip' }, ' \u2014 ' + W.clip(W.stripTags(x.snippet), 140))
        ]);
      })));
      return true;
    });
  }

  var jobs = [
    ['wikipedia', wikipedia],
    ['pictures \u00b7 wikimedia commons', commons],
    ['definition', definition],
    ['books \u00b7 open library', books],
    ['the archive \u00b7 internet archive', archive],
    ['photographs \u00b7 library of congress', loc],
    ['space \u00b7 nasa', nasa],
    ['living things \u00b7 inaturalist', nature],
    ['quotations \u00b7 wikiquote', quotes]
  ];

  var done = jobs.map(function (job) {
    var box = h('div', { class: 'body' });
    var sec = h('section', { class: 'sec', hidden: true }, [h('h2', {}, job[0]), box]);
    root.appendChild(sec);
    var lost = Math.random() < R.level() * 0.35;
    return Promise.resolve(lost ? false : job[1](box)).catch(function () { return false; }).then(function (ok) {
      if (ok) sec.hidden = false;
      return ok;
    });
  });

  var feed = h('div', { class: 'feed' });
  root.appendChild(feed);

  var wikiDone = done[0];
  var started = false;
  function start() {
    if (started) return;
    started = true;
    W.startFeed(feed, { title: state.title, first: state.links });
  }
  Promise.race([wikiDone, W.delay(5000)]).then(start);

  Promise.all(done).then(function (res) {
    if (!res.some(Boolean)) {
      root.insertBefore(h('p', { class: 'quiet' }, 'Nothing has been printed about this yet. Follow a link below.'), feed);
    }
  });

  var nav = {
    home: document.getElementById('home'),
    up: document.getElementById('up'),
    another: document.getElementById('another')
  };

  function deeper(label) { location.href = R.href(W.slugify(label) || 'void'); }

  nav.home.textContent = R.text(nav.home.textContent, 1.5);
  nav.home.addEventListener('click', function (e) {
    if (!R.lie()) return;
    e.preventDefault();
    deeper(R.pick(['home', 'no', 'stay', 'there-is-no-home']));
  });

  if (R.depth() > 1) {
    nav.up.hidden = false;
    nav.up.href = R.parentHref();
    nav.up.textContent = R.text(nav.up.textContent, 1.5);
    nav.up.addEventListener('click', function (e) {
      if (!R.lie()) return;
      e.preventDefault();
      deeper(R.pick(['back', 'forward', 'down', 'further']));
    });
  }

  nav.another.textContent = R.text(nav.another.textContent, 1.5);
  nav.another.addEventListener('click', function () {
    W.randomTitle().then(function (t) { deeper(t); });
  });

  R.start();
})();
