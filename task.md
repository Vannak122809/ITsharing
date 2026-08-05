# Security Hardening Tasks

- [x] Analyze stack and write plan
- [/] LAYER 0: Server-side R2 API (fix leaked secrets)
  - [/] Create `api/upload-url.js` — signed upload URL generator
  - [ ] Create `api/download-url.js` — signed download URL (optional)
  - [ ] Update `src/r2.js` — remove secret keys, use public URL only
  - [ ] Update `src/pages/Profile.jsx` — use API for avatar/cover upload
  - [ ] Update `.env` — remove secret VITE_ keys
- [ ] LAYER 2: Security Headers in `vercel.json`
- [ ] LAYER 3: Rate Limiter utility `src/utils/rateLimiter.js`
- [ ] LAYER 3: Apply rate limits to Login, Download, AI generation
- [ ] LAYER 4: Create `firestore.rules`
- [ ] LAYER 5: R2 CORS hardening script
- [ ] Git commit + push all security changes
