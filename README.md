# kg-auth

A static OAuth consent page, served by GitHub Pages.

- Sign-in is an email link; sign-ups are off, so only the owner gets one.
- Approval is refused unless the app returns to an allowed callback (`ALLOWED_CALLBACKS` in `consent.js`).
- The page holds no secrets: the URL and publishable key in `consent.js` are public by design.
- No third-party scripts: the client library is vendored in `vendor/` (integrity checked against the
  npm registry; MIT, see `vendor/supabase-js-LICENSE`), and a Content-Security-Policy allows only
  this site's scripts and the auth server.
