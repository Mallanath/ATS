(function(){
  try {
    var search = window.location.search || '';
    var params = new URLSearchParams(search);
    var blockedUrl = params.get('url') || params.get('site') || document.referrer || '';
    var urlEl = document.getElementById('blocked-url');
    var refreshEl = document.getElementById('refresh-link');
    if (blockedUrl && urlEl) {
      urlEl.textContent = blockedUrl;
      urlEl.title = blockedUrl;
      urlEl.href = blockedUrl;
      urlEl.removeAttribute('aria-disabled');
    } else if (urlEl) {
      urlEl.style.display = 'none';
    }
    if (blockedUrl && refreshEl) {
      refreshEl.href = blockedUrl;
      refreshEl.textContent = 'Refresh';
      refreshEl.title = blockedUrl;
      refreshEl.removeAttribute('aria-disabled');
    } else if (refreshEl) {
      refreshEl.style.display = 'none';
    }
  } catch(e) {
    // no-op
  }
})();
