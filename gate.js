/* MBE Access Gate — gate souple pour présentations statiques.
 * Login Google (GIS) → vérif serveur /api/access/check?resource=… → révèle la page.
 * Portable : JS pur, aucune dépendance à l'hébergeur. Config via window.MBE_GATE.
 * NB : protection "souple" (le HTML reste un fichier statique public sur le CDN).
 */
(function () {
  var CFG = window.MBE_GATE || {};
  var RESOURCE = CFG.resource || 'presentations';
  var PUBLIC = !!CFG.public; // futur : decks accessibles à tous (révèle sans vérif)
  var CLIENT_ID = '603627965278-5im3vkkb6m54s3ancrbadp47vasd7hj8.apps.googleusercontent.com';
  var API_BASE = 'https://mbe-backend-5ehb.onrender.com';
  var TOKEN_KEY = 'mbe_gate_token';

  function reveal() {
    document.body.style.visibility = 'visible';
    var o = document.getElementById('mbe-gate');
    if (o) o.parentNode && o.parentNode.removeChild(o);
  }

  function buildOverlay() {
    var o = document.getElementById('mbe-gate');
    if (o) return o;
    o = document.createElement('div');
    o.id = 'mbe-gate';
    o.style.cssText = 'visibility:visible;position:fixed;inset:0;z-index:2147483647;background:linear-gradient(160deg,#E2001A,#7a0010);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif';
    o.innerHTML = '<div style="background:#fff;border-radius:16px;padding:40px 46px;max-width:380px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
      + '<div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#E2001A;font-weight:700;margin-bottom:6px">MBE France</div>'
      + '<h2 style="margin:0 0 4px;font-size:20px;color:#221E1F">Accès sécurisé</h2>'
      + '<p style="margin:0 0 22px;color:#76767A;font-size:14px">Connecte-toi pour accéder à cette présentation.</p>'
      + '<div id="mbe-gate-btn" style="display:flex;justify-content:center"></div>'
      + '<div id="mbe-gate-msg" style="margin-top:16px;font-size:13px;min-height:18px"></div>'
      + '<div id="mbe-gate-spin" style="margin-top:6px;color:#9a9aa0;font-size:12px"></div>'
      + '</div>';
    document.documentElement.appendChild(o);
    return o;
  }

  function msg(text, ok) {
    var m = document.getElementById('mbe-gate-msg');
    if (m) { m.textContent = text || ''; m.style.color = ok ? '#1c6b3a' : '#fff'; m.style.fontWeight = '600'; }
  }
  function spin(text) { var s = document.getElementById('mbe-gate-spin'); if (s) s.textContent = text || ''; }

  function checkAccess(token, onFail) {
    spin('Vérification…');
    fetch(API_BASE + '/api/access/check?resource=' + encodeURIComponent(RESOURCE), {
      headers: { Authorization: 'Bearer ' + token },
    }).then(function (r) {
      if (r.status === 401) { sessionStorage.removeItem(TOKEN_KEY); spin(''); if (onFail) onFail(); return null; }
      return r.json();
    }).then(function (j) {
      if (!j) return;
      spin('');
      if (j.allowed) { sessionStorage.setItem(TOKEN_KEY, token); reveal(); }
      else { msg('Accès non autorisé pour ce compte — contacte Mayurr Digumber.'); if (onFail) onFail(); }
    }).catch(function () {
      spin(''); msg('Connexion au serveur impossible. Réessaie dans ~1 min (réveil du serveur).'); if (onFail) onFail();
    });
  }

  function renderButton() {
    var el = document.getElementById('mbe-gate-btn');
    if (!el || !(window.google && window.google.accounts && window.google.accounts.id)) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: function (resp) { checkAccess(resp.credential, function () {}); },
    });
    window.google.accounts.id.renderButton(el, { theme: 'filled_black', size: 'large', text: 'signin_with', shape: 'pill' });
  }

  function loadGis() {
    if (window.google && window.google.accounts && window.google.accounts.id) { renderButton(); return; }
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
    s.onload = renderButton;
    document.head.appendChild(s);
  }

  function start() {
    if (PUBLIC) { reveal(); return; }
    buildOverlay();
    var cached = sessionStorage.getItem(TOKEN_KEY);
    if (cached) checkAccess(cached, loadGis);
    else loadGis();
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
