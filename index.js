const express = require('express');
const fs = require('fs');
const path = require('path');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage,
    Browsers,
    delay 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const yts = require('yt-search');
const QRCode = require('qrcode');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const FormData = require('form-data');
const registerWebsite = require('./website');
const commandRegistry = require('./commands/loader');
const greetingSystem = require('./greetings');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve the selected ImgBB share page to its direct image URL.
registerWebsite(app, axios);

// Endpoint to generate Pairing Code (unchanged)
app.get('/pair', async (req, res) => {
    let phone = req.query.number || '919356730236';
    let cleanedNumber = phone.replace(/[^0-9]/g, '');

    if (!/^\d{10,15}$/.test(cleanedNumber)) {
        return res.json({ error: 'Enter a valid phone number with country code.' });
    }
    if (!sock) {
        return res.json({ error: 'WhatsApp socket is starting. Wait 5 seconds and try again.' });
    }

    try {
        const authDir = await getPersistentAuthDir();
        const loggedOutMarker = path.join(path.dirname(authDir), 'wa-logged-out.flag');
        const confirmedLoggedOut = waLoggedOut || fs.existsSync(loggedOutMarker);
        if (sock.authState?.creds?.registered && confirmedLoggedOut) {
            // Only reset auth after WhatsApp returned loggedOut/401 and the user explicitly requests pairing.
            // Keep a backup of auth files and never delete the /data volume itself.
            const backupDir = path.join(path.dirname(authDir), 'session-backup-' + Date.now());
            if (fs.existsSync(authDir)) {
                fs.cpSync(authDir, backupDir, { recursive: true, errorOnExist: false });
            }
            fs.rmSync(authDir, { recursive: true, force: true });
            fs.mkdirSync(authDir, { recursive: true });
            try { fs.rmSync(loggedOutMarker, { force: true }); } catch (_) {}
            waLoggedOut = false;
            // Recreate the WhatsApp socket in-process instead of exiting the whole web server.
            // This keeps the pairing endpoint available and avoids Railway 502s during recovery.
            try {
                if (sock && typeof sock.end === 'function') sock.end(new Error('Recreating socket for fresh pairing'));
            } catch (closeErr) {
                console.warn('Old WhatsApp socket close warning:', closeErr.message);
            }
            sock = null;
            res.json({ error: 'Old logged-out session was backed up and reset safely. WhatsApp is reinitializing now; wait 8 seconds, refresh this page, and request a new pairing code.' });
            setTimeout(() => {
                connectToWhatsApp().catch(err => console.error('Pairing recovery reconnect error:', err.message));
            }, 1000);
            return;
        }

        if (!sock.authState?.creds?.registered) {
            await delay(1000);
            const code = await sock.requestPairingCode(cleanedNumber);
            const normalizedCode = String(code || '').replace(/[^A-Z0-9]/gi, '');
            if (normalizedCode.length < 6) {
                console.error('Pairing API returned an invalid code:', String(code));
                return res.json({ error: 'WhatsApp returned an invalid pairing code. Wait 10 seconds, refresh the page, and try once more. If it repeats, check Railway logs.' });
            }
            return res.json({ code: normalizedCode, status: 'Success' });
        }
        return res.json({ error: 'Bot is already linked/registered and not marked logged out. Do not reset the session; check Railway logs first.' });
    } catch (err) {
        console.error('Pairing Code Generation Error:', err);
        return res.json({ error: 'Pairing Error: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 VFX MINI Web Server running on port ${PORT}`);
});

/* ============================================================
   ⚙️ BOT SETTINGS
   ============================================================ */
const startTime = Date.now();
let isAlwaysOnline = String(process.env.ALWAYS_ONLINE || 'false').toLowerCase() === 'true';
let isAutoStatusView = true;

// Refresh WhatsApp presence periodically while Always Online is enabled.
let presenceHeartbeat = null;
function syncAlwaysOnlineHeartbeat() {
    if (presenceHeartbeat) {
        clearInterval(presenceHeartbeat);
        presenceHeartbeat = null;
    }
    if (isAlwaysOnline) {
        presenceHeartbeat = setInterval(async () => {
            try {
                if (sock?.user) await sock.sendPresenceUpdate('available');
            } catch (err) {
                console.error('Always-online heartbeat error:', err.message);
            }
        }, 25000);
        presenceHeartbeat.unref?.();
    }
}
let isAutoReact = true;
let isAutoDL = true;
let PREFIX = '.';

async function getFastVideoUrl(url) {
    const encodedUrl = encodeURIComponent(url);
    try {
        const res1 = await axios.get(`https://api.tinew.tech/api/downloader/fbdl?url=${encodedUrl}`, { timeout: 10000 });
        if (res1.data?.result?.hd || res1.data?.result?.sd) return res1.data.result.hd || res1.data.result.sd;
    } catch(e) {}
    try {
        const res2 = await axios.get(`https://api.dreaded.site/api/fbdl?url=${encodedUrl}`, { timeout: 10000 });
        if (res2.data?.data?.hd || res2.data?.data?.sd || res2.data?.data?.url) return res2.data.data.hd || res2.data.data.sd || res2.data.data.url;
    } catch(e) {}
    try {
        const res3 = await axios.get(`https://api.siputzx.my.id/api/d/facebook?url=${encodedUrl}`, { timeout: 10000 });
        if (res3.data?.data?.video || res3.data?.data?.hd || res3.data?.data?.sd) return res3.data.data.video || res3.data.data.hd || res3.data.data.sd;
    } catch(e) {}
    try {
        const res4 = await axios.get(`https://api.vreden.web.id/api/download/fbdl?url=${encodedUrl}`, { timeout: 10000 });
        const link = res4.data?.result?.response?.video_hd || res4.data?.result?.response?.video_sd;
        if (link) return link;
    } catch(e) {}
    return null;
}

let reconnectTimer = null;
let isConnecting = false;
let waLoggedOut = false;

async function getPersistentAuthDir() {
    const localDir = path.resolve('session');
    const volumeDir = '/data';
    // Railway volume is mounted at /data. Copy the existing session once,
    // before switching auth storage, so the first persistent deploy can reuse it.
    if (fs.existsSync(volumeDir)) {
        const persistentDir = path.join(volumeDir, 'session');
        fs.mkdirSync(persistentDir, { recursive: true });
        const hasPersistentFiles = fs.existsSync(persistentDir) &&
            fs.readdirSync(persistentDir).some(name => name.endsWith('.json'));
        if (!hasPersistentFiles && fs.existsSync(localDir)) {
            fs.cpSync(localDir, persistentDir, { recursive: true, force: false, errorOnExist: false });
            console.log('📦 Migrated existing WhatsApp session to persistent Railway volume.');
        }
        return persistentDir;
    }
    console.warn('⚠️ Persistent /data volume not found; using local session folder.');
    return localDir;
}

async function connectToWhatsApp() {
    if (isConnecting) return;
    isConnecting = true;
    try {
    const authDir = await getPersistentAuthDir();
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu("Chrome")
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (!shouldReconnect) {
                waLoggedOut = true;
                try {
                    const authDir = await getPersistentAuthDir();
                    fs.writeFileSync(path.join(path.dirname(authDir), 'wa-logged-out.flag'), String(Date.now()));
                    console.log('⚠️ Logged-out marker saved. Session preserved until explicit re-pair request.');
                } catch (markerErr) {
                    console.error('Could not save logged-out marker:', markerErr.message);
                }
            }
            console.log('⚠️ Connection closed. Status:', statusCode, 'Reconnecting:', shouldReconnect);
            if (shouldReconnect && !reconnectTimer) {
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    connectToWhatsApp().catch(err => console.error('Reconnect error:', err.message));
                }, 3000);
            }
        } else if (connection === 'open') {
            console.log('\n==================================================');
            console.log('✅ VFX MINI IS ONLINE & CONNECTED SUCCESSFULLY!');
            console.log('==================================================\n');
            try {
                const userJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const startMessage = 
`🎬 *VFX MINI CONNECTED SUCCESSFULLY!* ⚡

👨‍💻 *Developers:* SOURAJITVFX & RAHUL AI
📌 *Prefix:* [ \`${PREFIX}\` ]
⚡ *Status:* Online & Ready 24/7
🟢 *Always Online:* ${isAlwaysOnline ? 'ON' : 'OFF'}
👀 *Auto Status View:* ${isAutoStatusView ? 'ON' : 'OFF'}
❤️ *Auto React:* ${isAutoReact ? 'ON' : 'OFF'}
🚀 *Super Fast Auto DL:* ${isAutoDL ? 'ON' : 'OFF'}

💡 *Try typing:* \`${PREFIX}menu\` or \`${PREFIX}ping\` to test commands!

⚙️ *Powered by VFX MINI*`;

                await sock.sendMessage(userJid, { text: startMessage });
            } catch (err) {
                console.error("Start Message Send Error:", err);
            }
        }
    });

    // Process only newly delivered messages. Baileys can emit older/history messages
    // as "append" during reconnect; ignoring those prevents stale commands replaying.
    const processedMessageIds = new Set();
    sock.ev.on('messages.upsert', async (m) => {
        try {
            if (m.type !== 'notify') return;
            const msg = m.messages?.[0];
            if (!msg?.message || !msg.key?.id) return;
            if (processedMessageIds.has(msg.key.id)) return;
            processedMessageIds.add(msg.key.id);
            if (processedMessageIds.size > 2000) {
                const oldestId = processedMessageIds.values().next().value;
                processedMessageIds.delete(oldestId);
            }

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || '';
            // Automatic greeting replies run before command parsing and skip the bot's own messages.
            if (!msg.key.fromMe && text.trim()) {
                await greetingSystem.handleIncoming(sock, msg, from, text).catch(err => console.error('[VFX MINI] Greeting error:', err.message));
            }

            if (isAutoReact && !msg.key.fromMe && from !== 'status@broadcast') {
                const emojis = ['❤️', '🔥', '⚡', '🤖', '👍', '⭐', '✨'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } });
            }

            if (isAlwaysOnline && from) {
                await sock.sendPresenceUpdate('available', from);
            }

            if (msg.key.remoteJid === 'status@broadcast') {
                if (isAutoStatusView) await sock.readMessages([msg.key]);
                return;
            }

            if (isAutoDL && !text.startsWith(PREFIX)) {
                const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);
                if (urlMatch) {
                    const url = urlMatch[0];
                    if (url.includes('instagram.com')) {
                        try {
                            await sock.sendMessage(from, { text: '📸 *Instagram AutoDL:* Downloading media...' }, { quoted: msg });
                            const res = await axios.get(`https://api.sayan-nexuswork.workers.dev/insta?url=${encodeURIComponent(url)}`, { timeout: 30000 });
                            const data = res.data;
                            const mediaUrl = data?.url || data?.urls?.[0];
                            if (data?.status === 'success' && mediaUrl) {
                                if (data.type === 'image' || /\.jpe?g(\?|$)/i.test(mediaUrl) || /\.png(\?|$)/i.test(mediaUrl)) await sock.sendMessage(from, { image: { url: mediaUrl }, caption: '📸 *VFX MINI Instagram AutoDL*' }, { quoted: msg });
                                else await sock.sendMessage(from, { video: { url: mediaUrl }, caption: '📸 *VFX MINI Instagram AutoDL*' }, { quoted: msg });
                                return;
                            }
                        } catch (e) { console.error('Instagram AutoDL error:', e.message); }
                    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        try {
                            await sock.sendMessage(from, { text: '🎬 *YouTube AutoDL:* Downloading video...' }, { quoted: msg });
                            const res = await axios.get(`https://api.sayan-nexuswork.workers.dev/video?query=${encodeURIComponent(url)}`, { timeout: 30000 });
                            const data = res.data;
                            if (data?.status === 'success' && data?.url) {
                                await sock.sendMessage(from, { video: { url: data.url }, caption: `🎬 *${data.title || 'VFX MINI Video'}*\n🎞️ Quality: ${data.quality || 'MP4'}` }, { quoted: msg });
                                return;
                            }
                        } catch (e) { console.error('YouTube AutoDL error:', e.message); }
                    } else if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('tiktok.com')) {
                        await sock.sendMessage(from, { text: '🚀 *Fast AutoDL:* Downloading video...' }, { quoted: msg });
                        const videoUrl = await getFastVideoUrl(url);
                        if (videoUrl) {
                            await sock.sendMessage(from, { video: { url: videoUrl }, caption: '⚡ *VFX MINI Fast AutoDL Success!*' }, { quoted: msg });
                            return;
                        }
                    }
                    await sock.sendMessage(from, { text: '❌ Download failed. Make sure the post is public and try again.' }, { quoted: msg });
                }
            }

            const isGroup = from.endsWith('@g.us');
            const prefixed = text.startsWith(PREFIX);
            const rawBody = prefixed ? text.slice(PREFIX.length).trim() : text.trim();
            const body = rawBody;
            const command = body.toLowerCase().split(/\s+/)[0];
            const args = body.split(/\s+/).slice(1).join(' ');
            const noPrefixCommands = new Set([
                'ai', 'alwaysonline', 'autodl', 'autoonline', 'autoreact', 'autostatus', 'autoupdate', 'calc', 'clear', 'fancy', 'font', 'fonts', 'fullpp', 'g', 'getpp', 'google', 'greet', 'greetings', 'help', 'insta', 'instagram', 'menu', 'mp3', 'mute', 'owner', 'pair', 'ping', 'ping1', 'ping2', 'ping3', 'ping4', 'ping5', 'play', 'prefix', 'qr', 'quote', 'restart', 's', 'setprefix', 'settings', 'song', 'statusview', 'sticker', 'tagall', 'tourl', 'unmute', 'update', 'upload', 'uptime', 'video', 'vv', 'weather', 'yta', 'ytvideo'
            ]);
            const isCmd = prefixed || noPrefixCommands.has(command);

            const contextInfo = msg.message.extendedTextMessage?.contextInfo;
            if (contextInfo?.quotedMessage) {
                const quotedMsg = contextInfo.quotedMessage;
                const isStatusReply = contextInfo.remoteJid === 'status@broadcast';
                const triggerWords = ['send', 'send me', 'dya', 'pathva', 'dakhva', 'sənd', 'पाठव', 'दे'];
                const userText = text.trim().toLowerCase();

                if (isStatusReply && triggerWords.some(word => userText.includes(word))) {
                    await sock.sendMessage(from, { text: '⏳ Status send karat aahe...' }, { quoted: msg });
                    try {
                        const mediaBuffer = await downloadMediaMessage(
                            { message: quotedMsg }, 'buffer', {}
                        );
                        if (quotedMsg.videoMessage) {
                            await sock.sendMessage(from, {
                                video: mediaBuffer,
                                caption: quotedMsg.videoMessage.caption || '🎬 *Here is your status video!*',
                                mimetype: 'video/mp4'
                            }, { quoted: msg });
                        } else if (quotedMsg.imageMessage) {
                            await sock.sendMessage(from, {
                                image: mediaBuffer,
                                caption: quotedMsg.imageMessage.caption || '🖼️ *Here is your status image!*'
                            }, { quoted: msg });
                        }
                    } catch (err) {
                        console.error('Status Send Error:', err);
                        await sock.sendMessage(from, { text: '❌ Status download karun pathvnyat adchan aali.' }, { quoted: msg });
                    }
                }
            }

            if (!isCmd) return;

            if (command === 'greet' || command === 'greetings') {
                const handled = await greetingSystem.handleCommand({
                    sock, msg, from, args: text.trim().split(/\\s+/).slice(1).join(' '),
                    isOwner: Boolean(msg.key.fromMe),
                    reply: async (message) => sock.sendMessage(from, { text: message }, { quoted: msg })
                });
                if (handled) return;
            }

            const modularHandled = await commandRegistry.execute(command, {
                sock,
                msg,
                from,
                args: text.trim().split(/\\s+/).slice(1),
                reply: async (message) => sock.sendMessage(from, { text: message }, { quoted: msg }),
                restartBot: async () => {
                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }
                    const oldSocket = sock;
                    sock = null;
                    try {
                        if (oldSocket && typeof oldSocket.end === 'function') {
                            oldSocket.end(new Error('Owner requested VFX MINI restart'));
                        }
                    } catch (err) {
                        console.warn('Socket close during restart:', err.message);
                    }
                    setTimeout(() => {
                        connectToWhatsApp().catch(err => console.error('Manual restart failed:', err.message));
                    }, 1200);
                }
            });
            if (modularHandled) return;

            if (command === 'restart') {
                if (!msg.key.fromMe) {
                    await sock.sendMessage(from, { text: '⛔ Restart command sirf bot owner ke liye hai.' }, { quoted: msg });
                    return;
                }
                await sock.sendMessage(from, { text: '🔄 *VFX MINI RESTARTING*\n\nWhatsApp connection restart ho raha hai. Session aur Railway /data volume delete nahi honge.' }, { quoted: msg });
                try {
                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }
                    const oldSocket = sock;
                    sock = null;
                    if (oldSocket && typeof oldSocket.end === 'function') {
                        try { oldSocket.end(new Error('Owner requested bot restart')); } catch (_) {}
                    }
                    setTimeout(() => {
                        connectToWhatsApp().catch(err => console.error('Manual restart failed:', err.message));
                    }, 1200);
                } catch (err) {
                    console.error('Manual restart error:', err.message);
                    await sock?.sendMessage(from, { text: '❌ Restart failed: ' + err.message }, { quoted: msg }).catch(() => {});
                }
                return;
            }

            if (command === 'clear') {
                await sock.sendMessage(from, {
                    text: '🧹 *VFX MINI CLEAR*\n\nWhatsApp chat history ko bot remotely poori tarah clear nahi kar sakta. Apne phone par WhatsApp menu se Clear chat karein. Bot session safe hai.'
                }, { quoted: msg });
                return;
            }

            if (command === 'vv') {
                const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const viewOnce = quoted?.viewOnceMessage?.message
                    || quoted?.viewOnceMessageV2?.message
                    || quoted?.viewOnceMessageV2Extension?.message
                    || msg.message.viewOnceMessage?.message
                    || msg.message.viewOnceMessageV2?.message;
                if (!viewOnce) {
                    await sock.sendMessage(from, { text: '╭━━〔 👁️ VFX MINI • VV 〕━━╮\n┃ View-once photo/video ko reply karke .vv bhejo.\n┃ Sirf media process hoga jo WhatsApp/Baileys is session mein accessible rakhta hai.\n╰━━━━━━━━━━━━━━━━━━━━━━╯' }, { quoted: msg });
                    return;
                }
                const mediaMsg = { key: msg.key, message: viewOnce };
                try {
                    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {});
                    if (viewOnce.imageMessage) {
                        await sock.sendMessage(from, { image: buffer, caption: '👁️ VFX MINI VV' }, { quoted: msg });
                    } else if (viewOnce.videoMessage) {
                        await sock.sendMessage(from, { video: buffer, caption: '👁️ VFX MINI VV', mimetype: 'video/mp4' }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: '❌ VV supports view-once photos and videos only.' }, { quoted: msg });
                    }
                } catch (e) {
                    console.error('VV media error:', e.message);
                    await sock.sendMessage(from, { text: '╭━━〔 ⚠️ VV ERROR 〕━━╮\n┃ Media decrypt nahi hua.\n┃ WhatsApp session ya media key unavailable ho sakti hai.\n╰━━━━━━━━━━━━━━━━━━━━━━╯' }, { quoted: msg });
                }
                return;
            }

            if (command === 'settings') {
                const settingsText = `
⚙️ *VFX MINI*
*BOT SETTINGS PANEL*

🟢 Always Online: ${isAlwaysOnline ? 'ON' : 'OFF'}
👀 Auto Status View: ${isAutoStatusView ? 'ON' : 'OFF'}
❤️ Auto React: ${isAutoReact ? 'ON' : 'OFF'}
📥 Auto Downloader: ${isAutoDL ? 'ON' : 'OFF'}

Prefix: ${PREFIX}

${PREFIX}alwaysonline on/off
${PREFIX}statusview on/off
${PREFIX}autoreact on/off
${PREFIX}autodl on/off
`;

                await sock.sendMessage(from, { text: settingsText }, { quoted: msg });
            }
            else if (command === 'update' || command === 'autoupdate') {
                await sock.sendMessage(from, { text: '🔄 *Checking for updates & pulling latest code from GitHub...*' }, { quoted: msg });
                exec('git pull', async (err, stdout, stderr) => {
                    if (err) return await sock.sendMessage(from, { text: `❌ *Update Failed:* ${err.message}` }, { quoted: msg });
                    if (stdout.includes('Already up to date')) return await sock.sendMessage(from, { text: '✅ *VFX MINI is already on the latest version!*' }, { quoted: msg });
                    await sock.sendMessage(from, { text: `✅ *Update Successful!*\n\n\`\`\`${stdout}\`\`\`\n\n🔄 *Restarting bot now...*` }, { quoted: msg });
                    process.exit(0);
                });
            }
            else if (command === 'alwaysonline' || command === 'autoonline') {
                if (!msg.key.fromMe) {
                    await sock.sendMessage(from, { text: '╭━━〔 🔒 OWNER ONLY 〕━━╮\n┃ Only the bot owner can change this setting.\n╰━━━━━━━━━━━━━━━━━━━━╯' }, { quoted: msg });
                    return;
                }
                const onlineAction = args.trim().toLowerCase();
                if (onlineAction === 'on') {
                    isAlwaysOnline = true;
                    syncAlwaysOnlineHeartbeat();
                    try { await sock.sendPresenceUpdate('available'); } catch (e) {}
                    try { await sock.sendPresenceUpdate('available', from); } catch (e) {}
                    await sock.sendMessage(from, { text: '╭━━〔 🟢 VFX MINI 〕━━╮\n┃ Always Online: *ON*\n┃ Presence heartbeat enabled.\n╰━━━━━━━━━━━━━━━━━━━━╯' }, { quoted: msg });
                } else if (onlineAction === 'off') {
                    isAlwaysOnline = false;
                    syncAlwaysOnlineHeartbeat();
                    try { await sock.sendPresenceUpdate('unavailable'); } catch (e) {}
                    try { await sock.sendPresenceUpdate('unavailable', from); } catch (e) {}
                    await sock.sendMessage(from, { text: '╭━━〔 🔴 VFX MINI 〕━━╮\n┃ Always Online: *OFF*\n┃ Presence heartbeat disabled.\n╰━━━━━━━━━━━━━━━━━━━━╯' }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        text: `╭━━〔 ⚙️ VFX MINI SETTINGS 〕━━╮\n┃ 🟢 ON: ${PREFIX}alwaysonline on\n┃ 🔴 OFF: ${PREFIX}alwaysonline off\n┃ 📌 STATUS: ${isAlwaysOnline ? '🟢 ON' : '🔴 OFF'}\n╰━━━━━━━━━━━━━━━━━━━━╯`
                    }, { quoted: msg });
                }
            }
            else if (command === 'statusview' || command === 'autostatus') {
                if (args.toLowerCase() === 'on') {
                    isAutoStatusView = true;
                    await sock.sendMessage(from, { text: '🟢 *Auto Status View is now ACTIVATED!*' }, { quoted: msg });
                } else if (args.toLowerCase() === 'off') {
                    isAutoStatusView = false;
                    await sock.sendMessage(from, { text: '🔴 *Auto Status View is now DEACTIVATED!*' }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { 
                        text: `👀 *Auto Status View Settings*\n\n🟢 On: \`${PREFIX}statusview on\`\n🔴 Off: \`${PREFIX}statusview off\`\n\n📌 *Status:* ${isAutoStatusView ? '🟢 ON' : '🔴 OFF'}` 
                    }, { quoted: msg });
                }
            }
            else if (command === 'autoreact') {
                if (args.toLowerCase() === 'on') {
                    isAutoReact = true;
                    await sock.sendMessage(from, { text: '❤️ *Auto React is now ACTIVATED!*' }, { quoted: msg });
                } else if (args.toLowerCase() === 'off') {
                    isAutoReact = false;
                    await sock.sendMessage(from, { text: '🖤 *Auto React is now DEACTIVATED!*' }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: `❤️ *Auto React Status:* ${isAutoReact ? 'ON' : 'OFF'}\nUse: \`${PREFIX}autoreact on/off\`` }, { quoted: msg });
                }
            }
            else if (command === 'autodl') {
                if (args.toLowerCase() === 'on') {
                    isAutoDL = true;
                    await sock.sendMessage(from, { text: '📥 *Auto DL (All Video Downloader) is now ACTIVATED!*' }, { quoted: msg });
                } else if (args.toLowerCase() === 'off') {
                    isAutoDL = false;
                    await sock.sendMessage(from, { text: '📤 *Auto DL is now DEACTIVATED!*' }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: `📥 *Auto DL Status:* ${isAutoDL ? 'ON' : 'OFF'}\nUse: \`${PREFIX}autodl on/off\`` }, { quoted: msg });
                }
            }
            else if (command === 'setprefix' || command === 'prefix') {
                if (!args) return await sock.sendMessage(from, { text: `⚙️ *Current Prefix:* \`${PREFIX}\`\n\nउदा. \`${PREFIX}setprefix !\` लिहून प्रिफिक्स बदला.` }, { quoted: msg });
                PREFIX = args.trim();
                await sock.sendMessage(from, { text: `✅ *Bot Prefix successfully changed to:* \`${PREFIX}\`` }, { quoted: msg });
            }
            else if (command === 'pair') {
                await sock.sendMessage(from, {
                    text: '🔗 *VFX MINI PAIRING PORTAL*\n\nOpen the pairing page only if WhatsApp is actually disconnected:\nhttps://vfx-mini-production.up.railway.app\n\n⚠️ This command does not relink an already-connected session. If this bot is online, do not pair again. Keep your existing session safe.'
                }, { quoted: msg });
            }
            else if (['ping', 'ping1', 'ping2', 'ping3', 'ping4', 'ping5'].includes(command)) {
                const startedAt = Date.now();
                const uptimeSeconds = Math.floor(process.uptime());
                const uptime = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;
                const latency = Math.max(0, Date.now() - (msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : startedAt));
                const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
                const styles = {
                    ping: `⚡ *VFX MINI SPEED* ⚡\n\n⏱️ Latency: ${latency} ms\n🟢 Status: Active & Online\n✨ SOURAJITVFX`,
                    ping1: `╭━━ ⚡ *VFX MINI • PING 01* ⚡ ━━╮\n┃ 🟢 Status: ONLINE\n┃ ⏱️ Reply: ${latency} ms\n┃ 🕒 Uptime: ${uptime}\n╰━━━━━━━━━━━━━━━━━━╯`,
                    ping2: `╭━━ 🚀 *VFX MINI • PING 02* 🚀 ━━╮\n┃ ▰▰▰▰▰ 100%\n┃ ⚡ Latency: ${latency} ms\n┃ 💾 RAM: ${ram} MB\n╰━━━━━━━━━━━━━━━━━━╯`,
                    ping3: `┏━━━ ✦ *SPEED CHECK* ✦ ━━━┓\n  ◉ ONLINE  •  ${latency} ms\n  ◉ UPTIME  •  ${uptime}\n  ◉ MEMORY  •  ${ram} MB\n┗━━━━━━━━━━━━━━━━━━━┛`,
                    ping4: `⚡━━━━━━━━ *VFX MINI* ━━━━━━━━⚡\n\n🚦 SYSTEM: READY\n📡 RESPONSE: ${latency} ms\n⏳ UPTIME: ${uptime}\n💾 RAM: ${ram} MB\n\n⚡ POWERED BY SOURAJITVFX`,
                    ping5: `╔═══════ ✨ *VFX MINI* ✨ ═══════╗\n║ Status  : 🟢 Online\n║ Latency : ${latency} ms\n║ Uptime  : ${uptime}\n║ RAM     : ${ram} MB\n╚════════════════════════════╝`
                };
                if (command === 'ping2') {
                    for (const frame of ['⏳ *Checking connection…*', '⚡ *Measuring response…*', '🚀 *VFX MINI ONLINE*']) {
                        await sock.sendMessage(from, { text: frame }, { quoted: msg });
                        await delay(180);
                    }
                }
                await sock.sendMessage(from, { text: styles[command] }, { quoted: msg });
            }
            else if (command === 'menu' || command === 'help') {
                const now = new Date();
                const uptimeSeconds = Math.floor(process.uptime());
                const uptimeHours = Math.floor(uptimeSeconds / 3600);
                const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
                const uptimeRemainder = uptimeSeconds % 60;
                const usedRam = Math.round(process.memoryUsage().rss / 1024 / 1024);
                const totalRam = Math.round(require('os').totalmem() / 1024 / 1024);
                const menuText = [
                    '╭━━━『 ✦ 𝙑𝙁𝙓 𝙈𝙄𝙉𝙄 ✦ 』━━━╮',
                    '┃ ⚡ *ᴘʀᴇᴍɪᴜᴍ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ*',
                    '┃ 👑 *ᴏᴡɴᴇʀ:* 𝐒ꭷᴜʀᴀᴊɪᴛ メ 𝐕𝐅𝐗',
                    '┃ ⌨️ *ᴘʀᴇғɪx:* ' + PREFIX,
                    '┃ 🟢 *sᴛᴀᴛᴜs:* ' + (sock?.user ? 'ᴄᴏɴɴᴇᴄᴛᴇᴅ' : 'sᴛᴀʀᴛɪɴɢ'),
                    '┃ ⏱️ *ᴜᴘᴛɪᴍᴇ:* ' + uptimeHours + 'h ' + uptimeMinutes + 'm ' + uptimeRemainder + 's',
                    '┃ 🧠 *ʀᴀᴍ:* ' + usedRam + '/' + totalRam + ' MB',
                    '┃ 📥 *ᴀᴜᴛᴏ ᴅʟ:* ' + (isAutoDL ? 'ᴏɴ' : 'ᴏғғ'),
                    '┃ 🌐 *ᴀʟᴡᴀʏs ᴏɴʟɪɴᴇ:* ' + (isAlwaysOnline ? 'ᴏɴ' : 'ᴏғғ'),
                    '┃ 🗓️ *ᴅᴀᴛᴇ:* ' + now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╭━━〔 ✨ ᴀɪ • sᴛʏʟᴇ ✨ 〕━━╮',
                    '┃ ◈ ' + PREFIX + 'ai <text>',
                    '┃ ◈ ' + PREFIX + 'google <query>',
                    '┃ ◈ ' + PREFIX + 'weather <city>',
                    '┃ ◈ ' + PREFIX + 'quote',
                    '┃ ◈ ' + PREFIX + 'fancy <text>',
                    '┃ ◈ ' + PREFIX + 'font <text>',
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╭━━〔 🎬 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 🎬 〕━━╮',
                    '┃ ◈ ' + PREFIX + 'play <song>',
                    '┃ ◈ ' + PREFIX + 'mp3 <song>',
                    '┃ ◈ ' + PREFIX + 'video <name>',
                    '┃ ◈ ' + PREFIX + 'insta <url>',
                    '┃ ◈ ᴏᴘᴇɴ ᴘᴜʙʟɪᴄ ᴠɪᴅᴇᴏ ʟɪɴᴋ ғᴏʀ ᴀᴜᴛᴏᴅʟ',
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╭━━〔 🧰 ᴛᴏᴏʟs 🧰 〕━━╮',
                    '┃ ◈ ' + PREFIX + 'ping / ping1 / ping2 / ping3 / ping4 / ping5',
                    '┃ ◈ ' + PREFIX + 'alive (bot status)',
                    '┃ ◈ ' + PREFIX + 'repo (GitHub repository)',
                    '┃ ◈ ' + PREFIX + 'vv (reply to view-once media)',
                    '┃ ◈ ' + PREFIX + 'pair (pairing portal)',
                    '┃ ◈ ' + PREFIX + 'uptime',
                    '┃ ◈ ' + PREFIX + 'greet list/create/edit/delete/schedule',
                    '┃ ◈ ' + PREFIX + 'calc <math>',
                    '┃ ◈ ' + PREFIX + 'qr <text>',
                    '┃ ◈ ' + PREFIX + 'tourl (reply media)',
                    '┃ ◈ ' + PREFIX + 'sticker (reply image)',
                    '┃ ◈ ' + PREFIX + 'getpp (profile photo)',
                    '┃ ◈ ' + PREFIX + 'fullpp (full profile photo)',
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╭━━〔 ⚙️ sᴇᴛᴛɪɴɢs ⚙️ 〕━━╮',
                    '┃ ◈ ' + PREFIX + 'setprefix <symbol>',
                    '┃ ◈ ' + PREFIX + 'alwaysonline on/off',
                    '┃ ◈ ' + PREFIX + 'statusview on/off',
                    '┃ ◈ ' + PREFIX + 'autoreact on/off',
                    '┃ ◈ ' + PREFIX + 'autodl on/off',
                    '┃ ◈ ' + PREFIX + 'settings',
                    '┃ ◈ ' + PREFIX + 'update',
                    '┃ ◈ ' + PREFIX + 'restart (owner only)',
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╭━━〔 👥 ɢʀᴏᴜᴘ ᴛᴏᴏʟs 👥 〕━━╮',
                    '┃ ◈ ' + PREFIX + 'tagall <message>',
                    '┃ ◈ ' + PREFIX + 'mute',
                    '┃ ◈ ' + PREFIX + 'unmute',
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╭━━〔 👑 ᴏᴡɴᴇʀ 👑 〕━━╮',
                    '┃ ◈ ' + PREFIX + 'owner',
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╰━━━『 ⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐒𝐎𝐔𝐑𝐀𝐉𝐈𝐓 𝐕𝐅𝐗 』━━━╯'
                ].join('\n');
                try {
                    const page = await axios.get('https://ibb.co/HL6Ftn8P', { timeout: 12000 });
                    const html = typeof page.data === 'string' ? page.data : '';
                    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
                    const imageUrl = match?.[1]?.replace(/&amp;/g, '&');
                    if (imageUrl) {
                        const imageResponse = await axios.get(imageUrl, {
                            responseType: 'arraybuffer',
                            timeout: 15000,
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });
                        await sock.sendMessage(from, { image: Buffer.from(imageResponse.data), caption: menuText }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: menuText }, { quoted: msg });
                    }
                } catch (menuImageError) {
                    console.error('Menu image error:', menuImageError.message);
                    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
                }
            }
            else if (command === 'getpp' || command === 'fullpp') {
                try {
                    const mentions = contextInfo?.mentionedJid || [];
                    const quotedSender = contextInfo?.participant;
                    const targetJid = mentions[0] || quotedSender || msg.key.participant || sock.user?.id;
                    if (!targetJid) {
                        return await sock.sendMessage(from, { text: '❌ Could not identify the contact. Try replying to their message or mentioning them.' }, { quoted: msg });
                    }
                    const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                    if (!ppUrl) {
                        return await sock.sendMessage(from, { text: '❌ Profile photo not available or privacy-restricted.' }, { quoted: msg });
                    }
                    const ppResponse = await axios.get(ppUrl, {
                        responseType: 'arraybuffer',
                        timeout: 20000,
                        maxRedirects: 5,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const ppBuffer = Buffer.from(ppResponse.data);
                    if (!ppBuffer.length) throw new Error('Empty profile photo response');
                    await sock.sendMessage(from, {
                        image: ppBuffer,
                        caption: command === 'fullpp' ? '🖼️ *VFX MINI FULL PROFILE PHOTO*' : '🖼️ *VFX MINI PROFILE PHOTO*'
                    }, { quoted: msg });
                } catch (err) {
                    console.error('Profile photo command error:', err.message);
                    await sock.sendMessage(from, {
                        text: '❌ Profile photo nahi mil payi. Contact ki privacy settings check karo, ya command ko unke message par reply karke try karo.'
                    }, { quoted: msg });
                }
            }
            else if (command === 'fancy' || command === 'font' || command === 'fonts') {
                if (!args.trim()) {
                    return await sock.sendMessage(from, {
                        text: `✨ *VFX MINI FANCY TEXT*\n\nUse: ${PREFIX}fancy Your Text\nExample: ${PREFIX}fancy SOURAJIT VFX`
                    }, { quoted: msg });
                }
                try {
                    const apiUrl = `https://eliteprotech-apis.zone.id/fun/font?text=${encodeURIComponent(args.trim())}`;
                    const response = await axios.get(apiUrl, { timeout: 20000 });
                    const styles = response.data?.results;
                    if (response.data?.status !== true || !Array.isArray(styles) || !styles.length) {
                        throw new Error('No font styles returned');
                    }
                    const lines = styles.slice(0, 35).map((item, index) =>
                        `${index + 1}. *${String(item.name || 'Font').replace(/([_*~])/g, '\\$1')}*\n${item.text || ''}`
                    );
                    const output = `✨ *VFX MINI FANCY TEXT* ✨\n\n📝 *Input:* ${args.trim()}\n\n${lines.join('\n\n')}\n\n⚡ Powered by VFX MINI`;
                    await sock.sendMessage(from, { text: output.slice(0, 60000) }, { quoted: msg });
                } catch (error) {
                    console.error('Fancy font API error:', error.message);
                    await sock.sendMessage(from, { text: '❌ Fancy font API abhi response nahi de rahi. Thodi der baad try karo.' }, { quoted: msg });
                }
            }
            else if (command === 'play' || command === 'song') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Song name taka! e.g. \`${PREFIX}play Blinding Lights\`` }, { quoted: msg });
                await sock.sendMessage(from, { text: `🎵 Searching: "${args}"...\n⚡ Preparing audio.` }, { quoted: msg });
                try {
                    const api = `https://api.sayan-nexuswork.workers.dev/music?query=${encodeURIComponent(args.trim())}`;
                    const res = await axios.get(api, { timeout: 20000 });
                    const data = res.data;
                    if (data?.status !== 'success' || !data?.url) {
                        return await sock.sendMessage(from, { text: '❌ Song not found or music API failed.' }, { quoted: msg });
                    }
                    const title = data.title || args;
                    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'audio';
                    const infoText = `🎵 *VFX MINI MUSIC PLAYER* 🎵\n\n📌 *Title:* ${title}\n⏱️ *Duration:* ${data.duration || 'Unknown'}\n👀 *Views:* ${data.views || 'Unknown'}\n🎙️ *Channel:* ${data.channel || 'Unknown'}\n🎧 *Quality:* ${data.quality || 'MP3'}`;
                    // Fetch audio bytes explicitly to avoid Baileys URL-stream issues and signed-URL redirects.
                    const audioRes = await axios.get(data.url, {
                        responseType: 'arraybuffer',
                        timeout: 60000,
                        maxRedirects: 5,
                        maxContentLength: 25 * 1024 * 1024,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const audioBuffer = Buffer.from(audioRes.data);
                    if (!audioBuffer.length) throw new Error('Audio response was empty');
                    await sock.sendMessage(from, {
                        audio: audioBuffer,
                        mimetype: 'audio/mpeg',
                        fileName: `${safeTitle}.mp3`,
                        ptt: false
                    }, { quoted: msg });
                    // Send track details after audio so the main download is not delayed by thumbnail fetching.
                    await sock.sendMessage(from, { text: infoText }, { quoted: msg });
                } catch (err) {
                    console.error('Play audio download/send error:', err.message);
                    const reason = err.response?.status ? `HTTP ${err.response.status}` : (err.code || err.message || 'unknown error');
                    await sock.sendMessage(from, { text: `❌ Play failed (${reason}). Try again or use a shorter track.` }, { quoted: msg });
                }
            }
            else if (command === 'mp3' || command === 'yta') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Song name taka! e.g. \`${PREFIX}mp3 Blinding Lights\`` }, { quoted: msg });
                await sock.sendMessage(from, { text: '🎵 *Downloading MP3 audio, please wait...*' }, { quoted: msg });
                try {
                    const api = `https://api.sayan-nexuswork.workers.dev/music?query=${encodeURIComponent(args)}`;
                    const res = await axios.get(api, { timeout: 30000 });
                    const data = res.data;
                    if (data?.status === 'success' && data?.url) {
                        const title = data.title || 'audio';
                        await sock.sendMessage(from, { audio: { url: data.url }, mimetype: 'audio/mpeg', ptt: false, fileName: `${title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80)}.mp3` }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: '❌ MP3 download failed. Song not found.' }, { quoted: msg });
                    }
                } catch (e) {
                    console.error('MP3 API error:', e.message);
                    await sock.sendMessage(from, { text: '❌ Server error while downloading audio.' }, { quoted: msg });
                }
            }
            else if (command === 'video' || command === 'ytvideo') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Video name taka! e.g. \`${PREFIX}video Tere Naam\`` }, { quoted: msg });
                await sock.sendMessage(from, { text: `🎬 Searching: "${args}"...\n⏳ Fetching video file, please wait.` }, { quoted: msg });
                try {
                    const api = `https://api.sayan-nexuswork.workers.dev/video?query=${encodeURIComponent(args.trim())}`;
                    const res = await axios.get(api, { timeout: 30000 });
                    const data = res.data;
                    if (data?.status !== 'success' || !data?.url) {
                        return await sock.sendMessage(from, { text: '❌ Video not found or video API failed.' }, { quoted: msg });
                    }
                    const caption = `🎬 *VFX MINI VIDEO DOWNLOADER*\n\n📌 *Title:* ${data.title || args}\n⏱️ *Duration:* ${data.duration || 'Unknown'}\n👀 *Views:* ${data.views || 'Unknown'}\n🎙️ *Channel:* ${data.channel || 'Unknown'}\n🎞️ *Quality:* ${data.quality || 'MP4'}`;
                    // Download bytes first; passing a signed Googlevideo URL directly to Baileys can fail on redirects/network restrictions.
                    const videoRes = await axios.get(data.url, {
                        responseType: 'arraybuffer',
                        timeout: 120000,
                        maxRedirects: 5,
                        maxContentLength: 80 * 1024 * 1024,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const videoBuffer = Buffer.from(videoRes.data);
                    if (!videoBuffer.length) throw new Error('Video response was empty');
                    await sock.sendMessage(from, { video: videoBuffer, mimetype: 'video/mp4', caption }, { quoted: msg });
                } catch (e) {
                    console.error('Video download/send error:', e.message);
                    const reason = e.response?.status ? `HTTP ${e.response.status}` : (e.code || e.message || 'unknown error');
                    await sock.sendMessage(from, { text: `❌ Video download failed (${reason}). Try a shorter video or retry shortly.` }, { quoted: msg });
                }
            }
            else if (command === 'insta' || command === 'instagram') {
                if (!args || !/instagram\.com\//i.test(args)) return await sock.sendMessage(from, { text: `❌ Instagram URL taka! e.g. \`${PREFIX}insta https://www.instagram.com/reel/URL\`` }, { quoted: msg });
                await sock.sendMessage(from, { text: '📥 *Downloading Instagram media...*' }, { quoted: msg });
                try {
                    const api = `https://api.sayan-nexuswork.workers.dev/insta?url=${encodeURIComponent(args.trim())}`;
                    const res = await axios.get(api, { timeout: 30000 });
                    const data = res.data;
                    const mediaUrl = data?.url || data?.urls?.[0];
                    if (data?.status !== 'success' || !mediaUrl) return await sock.sendMessage(from, { text: '❌ Instagram media unavailable or API failed.' }, { quoted: msg });
                    if (data.type === 'image' || /\.jpe?g(\?|$)/i.test(mediaUrl) || /\.png(\?|$)/i.test(mediaUrl)) {
                        await sock.sendMessage(from, { image: { url: mediaUrl }, caption: '📸 *VFX MINI Instagram Downloader*' }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { video: { url: mediaUrl }, caption: '📸 *VFX MINI Instagram Downloader*' }, { quoted: msg });
                    }
                } catch (e) {
                    console.error('Instagram API error:', e.message);
                    await sock.sendMessage(from, { text: '❌ Instagram download failed. Check that the post is public and try again.' }, { quoted: msg });
                }
            }
            else if (command === 'tourl' || command === 'upload') {
                const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const isMedia = msg.message.imageMessage || msg.message.videoMessage || msg.message.documentMessage || quoted?.imageMessage || quoted?.videoMessage || quoted?.documentMessage;
                if (!isMedia) return await sock.sendMessage(from, { text: `❌ Konvtyahi photo, video ya file la reply karun \`${PREFIX}tourl\` type kara!` }, { quoted: msg });
                await sock.sendMessage(from, { text: '📤 *Uploading media to server, please wait...*' }, { quoted: msg });
                try {
                    const mediaBuffer = await downloadMediaMessage(
                        quoted ? { message: quoted } : msg, 'buffer', {}
                    );
                    const form = new FormData();
                    form.append('file', mediaBuffer, { filename: 'vfx-mini-media.bin' });
                    const uploadRes = await axios.post('https://telegra.ph/upload', form, {
                        headers: { ...form.getHeaders() }
                    });
                    if (uploadRes.data && uploadRes.data[0] && uploadRes.data[0].src) {
                        const fileUrl = 'https://telegra.ph' + uploadRes.data[0].src;
                        await sock.sendMessage(from, { text: `🔗 *MEDIA UPLOADED SUCCESSFULLY!*\n\n📌 *URL:* ${fileUrl}` }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { text: '❌ Upload fail zali. Punha prayatna kara.' }, { quoted: msg });
                    }
                } catch (e) {
                    await sock.sendMessage(from, { text: '❌ Tourl error: ' + e.message }, { quoted: msg });
                }
            }
            else if (command === 'qr') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Text kiwa link taka! e.g. \`${PREFIX}qr Hello VFX MINI\`` }, { quoted: msg });
                try {
                    const qrBuffer = await QRCode.toBuffer(args);
                    await sock.sendMessage(from, { image: qrBuffer, caption: `🔲 *QR Code for:* ${args}` }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: '❌ QR Code banvnyat error aala.' }, { quoted: msg });
                }
            }
            else if (command === 'calc') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Ganiti samikaran taka! e.g. \`${PREFIX}calc 50 + 50 * 2\`` }, { quoted: msg });
                try {
                    const sanitized = args.replace(/[^0-9+\-*/().]/g, '');
                    const result = eval(sanitized);
                    await sock.sendMessage(from, { text: `🧮 *Calculator*\n\n❓ *Expression:* ${args}\n✅ *Answer:* ${result}` }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: '❌ Chukiche samikaran.' }, { quoted: msg });
                }
            }
            else if (command === 'quote') {
                const quotesList = [
                    "\"Yashachi survat nehami prayatnani hote.\" - VFX MINI",
                    "\"Kasht karnyachi tayari asel, tar kontehi swapna apoorna rahat nahi.\"",
                    "\"Aaj keleli mehanat udyache bhavishya tharavte.\"",
                    "\"Apyash hi yashachi pahili payari aahe.\""
                ];
                const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
                await sock.sendMessage(from, { text: `💡 *Daily Quote*\n\n${randomQuote}` }, { quoted: msg });
            }
            else if (command === 'uptime') {
                const uptimeMs = Date.now() - startTime;
                const seconds = Math.floor((uptimeMs / 1000) % 60);
                const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
                const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
                await sock.sendMessage(from, { 
                    text: `⏱️ *VFX MINI UPTIME*\n\nBot is running for: \`${hours} hours, ${minutes} minutes, ${seconds} seconds\`` 
                }, { quoted: msg });
            }
            else if (command === 'google' || command === 'g') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Krupaya search karnyasathi kahitari liha! e.g. \`${PREFIX}google India\`` }, { quoted: msg });
                await sock.sendMessage(from, { text: `🔍 Searching for "${args}"...` }, { quoted: msg });
                try {
                    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(args)}&format=json`;
                    const res = await axios.get(searchUrl);
                    let resultText = res.data.AbstractText || res.data.RelatedTopics?.[0]?.Text || 'Konthi mahiti sapadli nahi.';
                    await sock.sendMessage(from, { 
                        text: `🌐 *Google Search Results*\n\n📌 *Query:* ${args}\n\n📝 ${resultText}` 
                    }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: '❌ Search kartana error aala.' }, { quoted: msg });
                }
            }
            else if (command === 'weather') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Sharache naav taka! e.g. \`${PREFIX}weather Mumbai\`` }, { quoted: msg });
                await sock.sendMessage(from, { text: `🌤️ Fetching weather for ${args}...` }, { quoted: msg });
                try {
                    const weatherRes = await axios.get(`https://wttr.in/${encodeURIComponent(args)}?format=j1`);
                    const current = weatherRes.data.current_condition[0];
                    const area = weatherRes.data.nearest_area[0];
                    const weatherInfo = 
`🌤️ *Weather Report*
📍 *City:* ${area.areaName[0].value}, ${area.country[0].value}
🌡️ *Temperature:* ${current.temp_C} °C
💧 *Humidity:* ${current.humidity}%
🌬️ *Wind Speed:* ${current.windspeedKmph} km/h
☁️ *Condition:* ${current.weatherDesc[0].value}`;
                    await sock.sendMessage(from, { text: weatherInfo }, { quoted: msg });
                } catch {
                    await sock.sendMessage(from, { text: '❌ Havamanachi mahiti milvnyat apyash aale.' }, { quoted: msg });
                }
            }
            else if (command === 'sticker' || command === 's') {
                const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const isImage = msg.message.imageMessage || quoted?.imageMessage;
                if (isImage) {
                    await sock.sendMessage(from, { text: '⏳ Creating sticker...' }, { quoted: msg });
                    const media = await downloadMediaMessage(
                        quoted ? { message: quoted } : msg, 'buffer', {}
                    );
                    const sticker = new Sticker(media, {
                        pack: 'VFX MINI',
                        author: 'SOURAJITVFX & RAHUL AI',
                        type: StickerTypes.FULL,
                        categories: ['🤩', '🎉'],
                        quality: 70
                    });
                    const buffer = await sticker.toBuffer();
                    await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: `❌ Photola reply deun \`${PREFIX}sticker\` type kara!` }, { quoted: msg });
                }
            }
            else if (command === 'ai') {
                if (!args) return await sock.sendMessage(from, { text: `❌ Prashna taka! e.g. \`${PREFIX}ai Hello\`` }, { quoted: msg });
                await sock.sendMessage(from, { text: '🤖 *VFX AI is thinking...*' }, { quoted: msg });
                try {
                    const res = await axios.get(
                        `https://eliteprotech-apis.zone.id/ai/chatgpt?prompt=${encodeURIComponent(args)}`,
                        { timeout: 45000 }
                    );
                    const responseText = res.data?.text || res.data?.response || res.data?.message;
                    if (res.data?.success !== true || !responseText) throw new Error('AI API returned no answer');
                    await sock.sendMessage(from, { text: `🤖 *VFX AI Answer*\n\n${responseText}\n\n✨ Model: ${res.data?.model || 'ChatGPT'}` }, { quoted: msg });
                } catch (e) {
                    console.error('AI API error:', e.response?.status || e.message);
                    await sock.sendMessage(from, { text: '❌ AI API abhi response nahi de rahi. Thodi der baad try karo.' }, { quoted: msg });
                }
            }
            else if (command === 'tagall' && isGroup) {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                let mentionsText = `📢 *GROUP ANNOUNCEMENT*\n\n💬 *Message:* ${args || 'Attention Everyone!'}\n\n`;
                let mentions = [];
                for (let mem of participants) {
                    mentionsText += `👥 @${mem.id.split('@')[0]}\n`;
                    mentions.push(mem.id);
                }
                await sock.sendMessage(from, { text: mentionsText, mentions: mentions }, { quoted: msg });
            }
            else if (command === 'mute' && isGroup) {
                await sock.groupSettingUpdate(from, 'announcement');
                await sock.sendMessage(from, { text: '🔒 Group Settings Changed: Only Admins can send messages.' });
            }
            else if (command === 'unmute' && isGroup) {
                await sock.groupSettingUpdate(from, 'not_announcement');
                await sock.sendMessage(from, { text: '🔓 Group Settings Changed: All members can send messages.' });
            }
            else if (command === 'owner') {
                await sock.sendMessage(from, { text: `👑 *Owner Info*\n\nDevelopers: SOURAJITVFX & RAHUL AI\nBot: VFX MINI` }, { quoted: msg });
            }

        } catch (err) {
            console.error('Error handling message:', err);
        }
    });
    } catch (err) {
        console.error('WhatsApp connection setup failed:', err);
        if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectToWhatsApp().catch(e => console.error('Reconnect error:', e.message));
            }, 5000);
        }
    } finally {
        isConnecting = false;
    }
}

connectToWhatsApp().catch(err => console.error('Initial WhatsApp connection error:', err));