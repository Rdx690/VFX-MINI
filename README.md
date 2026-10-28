# VFX MINI ⚡

WhatsApp bot with a web-based pairing portal, utility commands and a gradual modular command system.

## Run
```bash
npm install
npm start
```

## Modular commands
- `commands/loader.js` discovers command modules.
- `commands/general/` contains general commands such as ping and uptime.
- `commands/owner/` contains owner-only controls such as restart.

Existing pairing website and legacy commands are retained during migration.

## Session safety
Keep the hosting platform's persistent storage mounted at `/data`. Do not publish WhatsApp session files or reset them unless explicitly requested.
