# kg-auth

The consent page for the second brain's kg connector, served by GitHub Pages at
`https://burcturkoglu.github.io/kg-auth/consent`. Supabase Auth's OAuth 2.1 server
sends the browser here (Authorization Path `/consent`) when Claude connects.

- Sign-in is an email link; sign-ups are off in Supabase, so only the owner's email gets one.
- Approval is refused unless the app returns to Claude's connector callback
  (`claude.ai` or `claude.com`, `/api/mcp/auth_callback`).
- The page holds no secrets. The Supabase URL and publishable key are public by design
  and can read or run nothing in the database.
- No third-party scripts: supabase-js 2.117.3 is vendored in `vendor/` (from the npm
  tarball, integrity checked against the registry; MIT, see `vendor/supabase-js-LICENSE`),
  and a Content-Security-Policy allows only this site's scripts and the Supabase project.

Design record: `docs/kg-connector.md` in `burcturkoglu/personal-knowledge-graph`.
