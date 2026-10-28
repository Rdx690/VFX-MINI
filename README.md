# ⚡ VFX MINI

**VFX MINI** is a WhatsApp automation bot by **SOURAJIT VFX**, with a web-based pairing portal and a gradually expanding, category-based command system.

## Run locally
```bash
npm install
npm start
```

## Command architecture
Commands are loaded recursively from `commands/`. Each command module exports `name`, optional `aliases`, `category`, `description`, and an async `execute(context)` function.

Current working modules include:
- **General:** `.ping`, `.uptime`, `.alive`, `.repo`, `.categories`
- **Owner:** `.restart` (owner-only)
- **Greetings:** `.greet list/create/edit/delete/schedule`

Category folders are prepared for the next original VFX MINI command modules: admin, AI, anime, fun, games, media, owner, textmaker, utility and general. The KnightBot-Mini repository is used as a feature reference; its source files are not copied wholesale.

## Hosting and persistent storage
- Start command: `npm start`
- Node.js: 20+
- Set `PUBLIC_URL` to the public URL of your deployed pairing portal if a command needs to display it.
- Mount persistent storage at `/data` (or set `DATA_DIR`) for WhatsApp session and greeting schedule persistence.
- Keep secrets and WhatsApp session files out of GitHub.

## Session safety
The existing session flow and pairing portal are retained. Do not delete or reset the session unless you explicitly decide to relink the WhatsApp account. A code push is not proof of a successful live deployment; check the host logs and test commands after deploying.
