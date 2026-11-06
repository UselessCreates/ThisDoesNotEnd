(function () {
  var W = window.Wayfarer;
  var button = document.getElementById('go');
  var busy = false;

  button.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    button.textContent = '\u2026';
    W.randomTitle().then(function (t) {
      location.href = '/' + (W.slugify(t) || 'donald-trump');
    });
  });
})();
