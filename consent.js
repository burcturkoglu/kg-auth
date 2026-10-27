// OAuth consent page.
// Static page: the project URL and publishable key below are public by design;
// the key alone can read or run nothing in the database.
'use strict';

const SUPABASE_URL = 'https://gggalauujrympyogdjoj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YP-XJ04Ki1UOFer_cOodGg_gQoUNWuP';

// The only places an approval may send you back to.
const ALLOWED_CALLBACKS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
];
const PENDING_KEY = 'kg_auth_pending_authorization';

const $ = (id) => document.getElementById(id);
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
});

function show(id) { $(id).hidden = false; }
function status(text) { $('status').textContent = text; }
function fail(text) { $('error').textContent = text; show('error'); status(''); }

function isAllowedCallback(url) {
  try {
    const u = new URL(url);
    return ALLOWED_CALLBACKS.includes(u.origin + u.pathname);
  } catch (_) { return false; }
}

function store(key, value) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (_) {}
}
function recall(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function goBack(url) {
  if (!isAllowedCallback(url)) { fail('Refused: the answer would go to ' + url + ', which is not allowed.'); return; }
  store(PENDING_KEY, null);
  window.location.assign(url);
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  let authId = params.get('authorization_id');
  if (authId) store(PENDING_KEY, authId); else authId = recall(PENDING_KEY);

  // Let supabase-js finish a sign-in link (?code=...) before anything else.
  await sb.auth.getSession();
  if (params.has('code') || params.has('error_description')) {
    if (params.get('error_description')) fail(params.get('error_description'));
    const clean = window.location.pathname + (authId ? '?authorization_id=' + encodeURIComponent(authId) : '');
    window.history.replaceState(null, '', clean);
  }

  const { data: { user } } = await sb.auth.getUser();
  if (user) { $('signout').hidden = false; }

  if (!authId) {
    status(user ? 'Signed in. Nothing to approve.' : 'Nothing to approve.');
    return;
  }

  if (!user) {
    status('');
    show('signin');
    $('signin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('email').value.trim();
      const redirect = window.location.origin + window.location.pathname + '?authorization_id=' + encodeURIComponent(authId);
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirect } });
      if (error) { fail(error.message); return; }
      $('signin').hidden = true;
      status('Check your email and open the link in this browser.');
    });
    return;
  }

  const { data, error } = await sb.auth.oauth.getAuthorizationDetails(authId);
  if (error || !data) { store(PENDING_KEY, null); fail((error && error.message) || 'This request has expired. Start again.'); return; }

  // Approved before: the server returns where to go next.
  if (!('authorization_id' in data)) { goBack(data.redirect_url); return; }

  status('');
  $('client-name').textContent = (data.client && data.client.name) || 'An app';
  $('redirect-uri').textContent = data.redirect_uri || '(none)';
  $('who').textContent = user.email || user.id;
  show('consent');

  const allowed = isAllowedCallback(data.redirect_uri);
  if (!allowed) { show('refused'); $('approve').disabled = true; }

  $('approve').addEventListener('click', async () => {
    if (!allowed) return;
    $('approve').disabled = true; $('deny').disabled = true;
    const r = await sb.auth.oauth.approveAuthorization(authId);
    if (r.error) { fail(r.error.message); return; }
    goBack(r.data.redirect_url);
  });
  $('deny').addEventListener('click', async () => {
    $('approve').disabled = true; $('deny').disabled = true;
    const r = await sb.auth.oauth.denyAuthorization(authId);
    store(PENDING_KEY, null);
    if (r.error) { fail(r.error.message); return; }
    if (isAllowedCallback(r.data.redirect_url)) window.location.assign(r.data.redirect_url);
    else status('Denied.');
  });
}

$('signout').addEventListener('click', async () => {
  await sb.auth.signOut();
  window.location.reload();
});

main().catch((e) => fail(String((e && e.message) || e)));
