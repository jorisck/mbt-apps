/* Espace de gestion : comportements côté navigateur. Aucun script inline, aucun eval (CSP stricte). */
(function () {
  'use strict';

  var csrfToken = function () {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  };

  /* --- Réauthentification (step-up) : fenêtre de saisie du mot de passe ---------------- */
  var dialog = document.getElementById('stepup-dialog');
  var form = document.getElementById('stepup-form');
  var pending = null;

  function closeDialog(result) {
    if (dialog && dialog.open) { dialog.close(); }
    if (pending) { pending(result); pending = null; }
  }

  function requestStepUp() {
    if (!dialog || !form) { return Promise.resolve(false); }
    if (pending) { return Promise.resolve(false); }
    var errorEl = document.getElementById('stepup-error');
    errorEl.classList.add('hidden');
    form.reset();
    dialog.showModal();
    document.getElementById('stepup-password').focus();
    return new Promise(function (resolve) { pending = resolve; });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var errorEl = document.getElementById('stepup-error');
      var body = new URLSearchParams({ password: document.getElementById('stepup-password').value });
      fetch('/auth/step-up', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': csrfToken(), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function (response) {
        if (response.ok) { closeDialog(true); return; }
        if (response.status === 401) { window.location.assign('/login'); return; }
        errorEl.textContent = 'Mot de passe incorrect.';
        errorEl.classList.remove('hidden');
        document.getElementById('stepup-password').select();
      }).catch(function () {
        errorEl.textContent = 'Connexion impossible. Réessayez.';
        errorEl.classList.remove('hidden');
      });
    });
    document.getElementById('stepup-cancel').addEventListener('click', function () { closeDialog(false); });
    dialog.addEventListener('cancel', function () { if (pending) { pending(false); pending = null; } });
  }

  /* --- HTMX --------------------------------------------------------------------------- */
  document.addEventListener('htmx:configRequest', function (event) {
    event.detail.headers['X-CSRF-Token'] = csrfToken();
  });

  function isStepUpResponse(xhr) {
    if (xhr.status !== 403) { return false; }
    var type = xhr.getResponseHeader('Content-Type') || '';
    if (type.indexOf('json') === -1) { return false; }
    try { return JSON.parse(xhr.responseText).code === 'step_up_required'; } catch (e) { return false; }
  }

  document.addEventListener('htmx:beforeSwap', function (event) {
    var xhr = event.detail.xhr;
    if (isStepUpResponse(xhr)) {
      event.detail.shouldSwap = false;
      event.detail.isError = false;
      var config = event.detail.requestConfig;
      requestStepUp().then(function (ok) {
        if (ok && window.htmx) {
          window.htmx.ajax(config.verb.toUpperCase(), config.path, { source: config.elt });
        }
      });
      return;
    }
    if (xhr.status >= 400 && xhr.status < 500 && xhr.status !== 401) {
      event.detail.shouldSwap = true;  /* erreurs affichées dans la page (messages d'erreur du serveur) */
      event.detail.isError = false;
    }
  });

  document.addEventListener('htmx:sendError', function () {
    var flash = document.getElementById('flash');
    if (flash) {
      flash.textContent = '';
      var box = document.createElement('div');
      box.className = 'alert-error';
      box.setAttribute('role', 'alert');
      box.textContent = 'Connexion au serveur impossible. Vérifiez votre réseau puis réessayez.';
      flash.appendChild(box);
    }
  });

  /* --- Compteur de nouvelles demandes dans le titre de l'onglet ----------------------- */
  var baseTitle = document.title;
  function updateTitle() {
    var node = document.querySelector('[data-new-count]');
    if (!node) { return; }
    var count = parseInt(node.getAttribute('data-new-count'), 10) || 0;
    document.title = (count > 0 ? '(' + count + ') ' : '') + baseTitle;
  }
  document.addEventListener('htmx:afterSwap', updateTitle);
  document.addEventListener('DOMContentLoaded', updateTitle);

  /* --- Export CSV : réauthentification puis téléchargement ---------------------------- */
  function exportUrl() {
    var params = new URLSearchParams();
    var filters = document.getElementById('filters');
    if (filters) {
      new FormData(filters).forEach(function (value, key) {
        if (typeof value === 'string' && value !== '') { params.append(key, value); }
      });
    }
    var health = document.querySelector('#export-form input[name="include_health"]');
    if (health && health.checked) { params.set('include_health', '1'); }
    return '/demandes/export.csv?' + params.toString();
  }

  function download(url, retried) {
    return fetch(url, { credentials: 'same-origin' }).then(function (response) {
      if (response.status === 403 && !retried) {
        return response.json().then(function (data) {
          if (data.code !== 'step_up_required') { throw new Error('forbidden'); }
          return requestStepUp().then(function (ok) { return ok ? download(url, true) : null; });
        });
      }
      if (!response.ok) { throw new Error('export'); }
      return response.blob().then(function (blob) {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'demandes.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
      });
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-export-link]');
    if (!button) { return; }
    event.preventDefault();
    download(exportUrl(), false).catch(function () {
      var flash = document.getElementById('flash');
      if (flash) {
        flash.textContent = "L'export a échoué. Réessayez.";
        flash.className = 'mx-auto max-w-7xl px-4 pt-4 text-sm text-red-700';
      }
    });
  });
})();
