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

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sock = null;

/* ============================================================
   🔥 VFX MINI — PREMIUM PAIRING PORTAL (NEW STYLE)
   ============================================================ */
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VFX MINI • Premium Pairing Portal</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter',sans-serif; }
            :root{
                --primary:#00e5ff;
                --secondary:#a855f7;
                --accent:#ff2e88;
                --bg:#05060d;
                --card:rgba(15,17,30,0.75);
                --border:rgba(0,229,255,0.25);
                --text:#e2e8f0;
                --muted:#7c8798;
            }
            html,body{height:100%;}
            body{
                background:var(--bg);
                color:var(--text);
                min-height:100vh;
                overflow-x:hidden;
                position:relative;
                display:flex;
                flex-direction:column;
            }
            /* VFX Background */
            body::before{
                content:'';position:fixed;inset:0;
                background:
                    radial-gradient(ellipse at 15% 20%, rgba(0,229,255,0.18), transparent 55%),
                    radial-gradient(ellipse at 85% 25%, rgba(168,85,247,0.18), transparent 55%),
                    radial-gradient(ellipse at 50% 95%, rgba(255,46,136,0.15), transparent 60%);
                z-index:0;
                animation:pulseBg 10s ease-in-out infinite;
            }
            @keyframes pulseBg{
                0%,100%{opacity:0.85;}
                50%{opacity:1;}
            }
            /* Animated grid */
            body::after{
                content:'';position:fixed;inset:0;
                background-image:
                    linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px);
                background-size:50px 50px;
                z-index:0;
                mask-image:radial-gradient(circle at center, black 30%, transparent 85%);
                -webkit-mask-image:radial-gradient(circle at center, black 30%, transparent 85%);
                animation:gridMove 20s linear infinite;
            }
            @keyframes gridMove{
                0%{background-position:0 0;}
                100%{background-position:50px 50px;}
            }
            /* Floating particles */
            .particles{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;}
            .particle{
                position:absolute;width:3px;height:3px;border-radius:50%;
                background:var(--primary);box-shadow:0 0 10px var(--primary);
                animation:float linear infinite;
            }
            @keyframes float{
                0%{transform:translateY(100vh) scale(0);opacity:0;}
                10%{opacity:1;}
                90%{opacity:1;}
                100%{transform:translateY(-10vh) scale(1.2);opacity:0;}
            }

            /* ============ NAVBAR ============ */
            .navbar{
                position:relative;z-index:50;
                display:flex;align-items:center;justify-content:space-between;
                padding:18px 32px;
                background:rgba(8,10,20,0.75);
                backdrop-filter:blur(18px);
                -webkit-backdrop-filter:blur(18px);
                border-bottom:1px solid var(--border);
            }
            .nav-brand{
                display:flex;align-items:center;gap:12px;
                font-family:'Orbitron',sans-serif;font-weight:900;
                font-size:22px;letter-spacing:2px;
            }
            .brand-icon{
                width:42px;height:42px;border-radius:12px;
                background:linear-gradient(135deg,var(--primary),var(--secondary));
                display:flex;align-items:center;justify-content:center;
                font-size:20px;color:#05060d;
                box-shadow:0 0 20px rgba(0,229,255,0.6);
                animation:iconPulse 2s ease-in-out infinite;
            }
            @keyframes iconPulse{
                0%,100%{box-shadow:0 0 20px rgba(0,229,255,0.6);}
                50%{box-shadow:0 0 35px rgba(168,85,247,0.8);}
            }
            .brand-text{
                background:linear-gradient(90deg,var(--primary),var(--secondary),var(--accent));
                -webkit-background-clip:text;background-clip:text;
                -webkit-text-fill-color:transparent;
                filter:drop-shadow(0 0 12px rgba(0,229,255,0.4));
            }
            .brand-text small{
                display:block;font-size:9px;letter-spacing:4px;
                font-family:'Inter';font-weight:600;color:var(--muted);
                -webkit-text-fill-color:var(--muted);
            }
            .nav-links{
                display:flex;align-items:center;gap:6px;
                list-style:none;
            }
            .nav-links a{
                color:var(--muted);text-decoration:none;
                font-size:14px;font-weight:500;
                padding:9px 16px;border-radius:10px;
                transition:all .3s ease;
                display:flex;align-items:center;gap:7px;
            }
            .nav-links a:hover{
                color:var(--primary);
                background:rgba(0,229,255,0.08);
                box-shadow:0 0 15px rgba(0,229,255,0.15);
            }
            .nav-links a i{font-size:13px;}
            .hamburger{
                display:none;background:none;border:none;color:var(--primary);
                font-size:22px;cursor:pointer;padding:8px;
            }

            /* ============ MAIN CARD ============ */
            .main-wrap{
                flex:1;display:flex;align-items:center;justify-content:center;
                padding:40px 20px;position:relative;z-index:10;
            }
            .card{
                position:relative;
                width:100%;max-width:440px;
                background:var(--card);
                backdrop-filter:blur(24px);
                -webkit-backdrop-filter:blur(24px);
                border-radius:26px;
                padding:38px 30px 30px;
                border:1px solid var(--border);
                box-shadow:
                    0 25px 60px rgba(0,0,0,0.7),
                    0 0 60px rgba(0,229,255,0.12),
                    inset 0 1px 0 rgba(255,255,255,0.06);
                text-align:center;
                transform-style:preserve-3d;
                transition:transform .3s ease;
                animation:cardIn .8s cubic-bezier(.2,.9,.3,1.2);
            }
            @keyframes cardIn{
                0%{opacity:0;transform:translateY(40px) scale(.95);}
                100%{opacity:1;transform:translateY(0) scale(1);}
            }
            /* Top gradient line */
            .card::before{
                content:'';position:absolute;top:0;left:20%;right:20%;height:2px;
                background:linear-gradient(90deg,transparent,var(--primary),var(--secondary),transparent);
                border-radius:2px;
                box-shadow:0 0 15px var(--primary);
            }

            .logo-badge{
                display:inline-flex;align-items:center;justify-content:center;
                gap:10px;
                padding:12px 26px;border-radius:50px;
                background:rgba(0,229,255,0.08);
                border:1.5px solid rgba(0,229,255,0.5);
                margin-bottom:20px;
                box-shadow:0 0 25px rgba(0,229,255,0.35), inset 0 0 20px rgba(0,229,255,0.05);
                animation:badgeGlow 2.5s ease-in-out infinite;
            }
            @keyframes badgeGlow{
                0%,100%{box-shadow:0 0 25px rgba(0,229,255,0.35);border-color:rgba(0,229,255,0.5);}
                50%{box-shadow:0 0 40px rgba(168,85,247,0.6);border-color:rgba(168,85,247,0.7);}
            }
            .logo-badge i{font-size:20px;color:var(--primary);filter:drop-shadow(0 0 6px var(--primary));}
            .logo-badge span{
                font-family:'Orbitron',sans-serif;font-weight:700;
                font-size:18px;letter-spacing:3px;
                background:linear-gradient(90deg,var(--primary),var(--secondary));
                -webkit-background-clip:text;background-clip:text;
                -webkit-text-fill-color:transparent;
            }

            h1{
                font-family:'Orbitron',sans-serif;
                font-size:20px;font-weight:700;
                letter-spacing:2px;margin-bottom:8px;
                color:#fff;
            }
            .subtitle{
                font-size:13px;color:var(--muted);
                margin-bottom:26px;line-height:1.5;
            }

            .input-group{position:relative;margin-bottom:18px;}
            .input-group i{
                position:absolute;left:18px;top:50%;
                transform:translateY(-50%);
                color:var(--primary);font-size:16px;
                filter:drop-shadow(0 0 4px var(--primary));
            }
            input[type="text"]{
                width:100%;padding:15px 15px 15px 48px;
                border-radius:14px;
                border:1.5px solid rgba(0,229,255,0.2);
                background:rgba(5,8,18,0.8);
                color:#fff;font-size:15px;
                letter-spacing:1px;
                outline:none;
                transition:all .3s ease;
            }
            input[type="text"]:focus{
                border-color:var(--primary);
                box-shadow:0 0 20px rgba(0,229,255,0.35), inset 0 0 12px rgba(0,229,255,0.06);
                background:rgba(5,8,18,0.95);
            }
            input[type="text"]::placeholder{color:#4a5568;}

            .btn-main{
                width:100%;padding:15px;
                border-radius:14px;border:none;
                font-family:'Orbitron',sans-serif;
                font-size:15px;font-weight:700;letter-spacing:2px;
                color:#05060d;cursor:pointer;
                background:linear-gradient(90deg,var(--primary),var(--secondary),var(--accent),var(--primary));
                background-size:300% auto;
                box-shadow:0 0 25px rgba(0,229,255,0.5), 0 8px 20px rgba(0,0,0,0.4);
                transition:all .4s ease;
                animation:btnShift 4s linear infinite;
                position:relative;overflow:hidden;
            }
            @keyframes btnShift{
                0%{background-position:0% 50%;}
                100%{background-position:300% 50%;}
            }
            .btn-main:hover{
                transform:translateY(-2px);
                box-shadow:0 0 40px rgba(168,85,247,0.7), 0 12px 28px rgba(0,0,0,0.5);
            }
            .btn-main:active{transform:translateY(0);}
            .btn-main i{margin-right:8px;}

            .code-box{
                margin-top:22px;padding:20px;
                background:rgba(0,229,255,0.05);
                border-radius:16px;
                border:1.5px dashed rgba(0,229,255,0.5);
                display:none;
                box-shadow:inset 0 0 25px rgba(0,229,255,0.08), 0 0 25px rgba(0,229,255,0.15);
                animation:codeIn .5s ease;
            }
            @keyframes codeIn{
                0%{opacity:0;transform:scale(.9);}
                100%{opacity:1;transform:scale(1);}
            }
            .code-box .label{
                font-size:11px;letter-spacing:3px;
                color:var(--primary);font-weight:600;
                margin-bottom:10px;text-transform:uppercase;
            }
            .code-box h2{
                font-family:'Orbitron',sans-serif;
                font-size:32px;letter-spacing:8px;
                color:var(--primary);
                text-shadow:0 0 20px var(--primary), 0 0 40px var(--secondary);
                animation:codePulse 1.8s ease-in-out infinite;
            }
            @keyframes codePulse{
                0%,100%{text-shadow:0 0 20px var(--primary),0 0 40px var(--secondary);}
                50%{text-shadow:0 0 30px var(--primary),0 0 60px var(--accent);}
            }

            /* Developer credits */
            .dev-credits{
                margin-top:26px;padding-top:20px;
                border-top:1px solid rgba(255,255,255,0.06);
                display:flex;justify-content:center;gap:24px;
                flex-wrap:wrap;
            }
            .dev{
                display:flex;align-items:center;gap:8px;
                font-size:12px;color:var(--muted);
            }
            .dev i{
                width:26px;height:26px;border-radius:8px;
                display:flex;align-items:center;justify-content:center;
                background:rgba(0,229,255,0.1);
                color:var(--primary);font-size:12px;
                border:1px solid rgba(0,229,255,0.25);
            }
            .dev b{color:var(--primary);font-weight:600;letter-spacing:.5px;}

            /* ============ FOOTER ============ */
            .site-footer{
                position:relative;z-index:10;
                padding:16px 24px;
                text-align:center;
                font-size:11px;
                color:var(--muted);
                letter-spacing:1.5px;
                border-top:1px solid rgba(255,255,255,0.04);
            }
            .site-footer span{color:var(--primary);font-weight:600;}

            /* ============ RESPONSIVE ============ */
            @media (max-width:768px){
                .navbar{padding:14px 18px;}
                .nav-links{
                    position:absolute;top:100%;left:0;right:0;
                    flex-direction:column;align-items:stretch;
                    background:rgba(8,10,20,0.97);
                    backdrop-filter:blur(20px);
                    padding:12px;
                    border-bottom:1px solid var(--border);
                    display:none;
                    gap:4px;
                }
                .nav-links.open{display:flex;}
                .hamburger{display:block;}
                .card{padding:30px 22px 24px;}
                .brand-text{font-size:18px;}
                .code-box h2{font-size:26px;letter-spacing:5px;}
            }
            @media (max-width:380px){
                .brand-text small{display:none;}
                .logo-badge span{font-size:15px;letter-spacing:2px;}
            }
        </style>
    </head>
    <body>

        <!-- Floating Particles -->
        <div class="particles" id="particles"></div>

        <!-- ============ NAVBAR ============ -->
        <nav class="navbar">
            <div class="nav-brand">
                <div class="brand-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                <div class="brand-text">
                    VFX MINI
                    <small>PREMIUM PAIRING</small>
                </div>
            </div>
            <ul class="nav-links" id="navLinks">
                <li><a href="#"><i class="fa-solid fa-house"></i> Home</a></li>
                <li><a href="#"><i class="fa-solid fa-link"></i> Pair</a></li>
                <li><a href="#"><i class="fa-solid fa-book"></i> Docs</a></li>
                <li><a href="#"><i class="fa-solid fa-headset"></i> Support</a></li>
            </ul>
            <button class="hamburger" id="hamburger"><i class="fa-solid fa-bars"></i></button>
        </nav>

        <!-- ============ MAIN CARD ============ -->
        <div class="main-wrap">
            <div class="card" id="mainCard">
                <div class="logo-badge">
                    <i class="fa-solid fa-bolt"></i>
                    <span>VFX MINI</span>
                </div>

                <h1>PAIRING PORTAL</h1>
                <p class="subtitle">Enter your WhatsApp number to receive<br>a secure pairing code</p>

                <div class="input-group">
                    <i class="fa-solid fa-phone"></i>
                    <input type="text" id="phone" value="919356730236" placeholder="e.g. 919356730236">
                </div>

                <button class="btn-main" onclick="getPairingCode()">
                    <i class="fa-solid fa-bolt"></i> GET PAIRING CODE
                </button>

                <div id="codeContainer" class="code-box">
                    <div class="label">Your Pairing Code</div>
                    <h2 id="pairCode">-----</h2>
                </div>

                <div class="dev-credits">
                    <div class="dev"><i class="fa-solid fa-code"></i> <b>SOURAJITVFX</b></div>
                    <div class="dev"><i class="fa-solid fa-robot"></i> <b>RAHUL AI</b></div>
                </div>
            </div>
        </div>

        <!-- ============ FOOTER ============ -->
        <footer class="site-footer">
            POWERED BY <span>VFX MINI</span> • DEVELOPED BY <span>SOURAJITVFX</span> &amp; <span>RAHUL AI</span>
        </footer>

        <script>
            // ---------- Floating Particles ----------
            (function(){
                const container = document.getElementById('particles');
                const colors = ['#00e5ff','#a855f7','#ff2e88'];
                for(let i=0;i<30;i++){
                    const p = document.createElement('div');
                    p.className = 'particle';
                    p.style.left = Math.random()*100 + '%';
                    p.style.background = colors[Math.floor(Math.random()*colors.length)];
                    p.style.boxShadow = '0 0 10px ' + p.style.background;
                    p.style.animationDuration = (Math.random()*10 + 8) + 's';
                    p.style.animationDelay = (Math.random()*10) + 's';
                    p.style.opacity = Math.random()*0.6 + 0.2;
                    container.appendChild(p);
                }
            })();

            // ---------- Mobile Nav ----------
            const hamburger = document.getElementById('hamburger');
            const navLinks = document.getElementById('navLinks');
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('open');
                hamburger.innerHTML = navLinks.classList.contains('open')
                    ? '<i class="fa-solid fa-xmark"></i>'
                    : '<i class="fa-solid fa-bars"></i>';
            });

            // ---------- 3D Tilt Effect on Card ----------
            const card = document.getElementById('mainCard');
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width/2;
                const y = e.clientY - rect.top - rect.height/2;
                card.style.transform = 'rotateY(' + (x/35) + 'deg) rotateX(' + (-y/35) + 'deg)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'rotateY(0) rotateX(0)';
            });

            // ---------- Pairing Logic (same-to-same) ----------
            async function getPairingCode() {
                const phone = document.getElementById('phone').value.trim();
                if(!phone) return alert('Please enter phone number');
                const btn = document.querySelector('.btn-main');
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GENERATING...';
                btn.disabled = true;

                try {
                    const res = await fetch('/pair?number=' + phone);
                    const data = await res.json();
                    if(data.code) {
                        document.getElementById('codeContainer').style.display = 'block';
                        document.getElementById('pairCode').innerText = data.code;
                    } else {
                        alert(data.error || 'Failed to get code. Please refresh & try again.');
                    }
                } catch(e) {
                    alert('Error connecting to server');
                }
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        </script>
    </body>
    </html>
    `);
});

// Endpoint to generate Pairing Code (unchanged)
app.get('/pair', async (req, res) => {
    let phone = req.query.number || '919356730236';
    let cleanedNumber = phone.replace(/[^0-9]/g, '');

    if (!sock) {
        return res.json({ error: 'WhatsApp Socket is initialising, please wait 5 seconds and click again.' });
    }

    try {
        if (!sock.authState.creds.registered) {
            await delay(1500);
            let code = await sock.requestPairingCode(cleanedNumber);
            return res.json({ code: code, status: 'Success' });
        } else {
            return res.json({ error: 'Bot is already linked/registered!' });
        }
    } catch (err) {
        console.error("Pairing Code Generation Error:", err);
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

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || '';

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
            const isCmd = text.startsWith(PREFIX);
            const body = isCmd ? text.slice(PREFIX.length).trim() : text.trim();
            const command = body.toLowerCase().split(' ')[0];
            const args = body.split(' ').slice(1).join(' ');

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

            if (!isCmd && command !== 'ping' && command !== 'menu') return;

            if (command === 'update' || command === 'autoupdate') {
                await sock.sendMessage(from, { text: '🔄 *Checking for updates & pulling latest code from GitHub...*' }, { quoted: msg });
                exec('git pull', async (err, stdout, stderr) => {
                    if (err) return await sock.sendMessage(from, { text: `❌ *Update Failed:* ${err.message}` }, { quoted: msg });
                    if (stdout.includes('Already up to date')) return await sock.sendMessage(from, { text: '✅ *VFX MINI is already on the latest version!*' }, { quoted: msg });
                    await sock.sendMessage(from, { text: `✅ *Update Successful!*\n\n\`\`\`${stdout}\`\`\`\n\n🔄 *Restarting bot now...*` }, { quoted: msg });
                    process.exit(0);
                });
            }
            else if (command === 'alwaysonline' || command === 'autoonline') {
                if (args.toLowerCase() === 'on') {
                    isAlwaysOnline = true;
                    syncAlwaysOnlineHeartbeat();
                    try { await sock.sendPresenceUpdate('available'); } catch (e) {}
                    try { await sock.sendPresenceUpdate('available', from); } catch (e) {}
                    await sock.sendMessage(from, { text: '🟢 *Always Online Status is now ACTIVATED!*' }, { quoted: msg });
                } else if (args.toLowerCase() === 'off') {
                    isAlwaysOnline = false;
                    syncAlwaysOnlineHeartbeat();
                    try { await sock.sendPresenceUpdate('unavailable'); } catch (e) {}
                    try { await sock.sendPresenceUpdate('unavailable', from); } catch (e) {}
                    await sock.sendMessage(from, { text: '🔴 *Always Online Status is now DEACTIVATED!*' }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { 
                        text: `⚙️ *Always Online Settings*\n\n🟢 On: \`${PREFIX}alwaysonline on\`\n🔴 Off: \`${PREFIX}alwaysonline off\`\n\n📌 *Status:* ${isAlwaysOnline ? '🟢 ON' : '🔴 OFF'}` 
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
            else if (command === 'ping') {
                const start = Date.now();
                await sock.sendMessage(from, { text: '🚀 Speed testing...' }, { quoted: msg });
                const end = Date.now();
                await sock.sendMessage(from, { 
                    text: `⚡ *VFX MINI SPEED*\n\n⏱️ *Latency:* \`${end - start} ms\`\n🟢 *Status:* Active & Online` 
                }, { quoted: msg });
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
                    '┃ ◈ ' + PREFIX + 'ping',
                    '┃ ◈ ' + PREFIX + 'uptime',
                    '┃ ◈ ' + PREFIX + 'calc <math>',
                    '┃ ◈ ' + PREFIX + 'qr <text>',
                    '┃ ◈ ' + PREFIX + 'tourl (reply media)',
                    '┃ ◈ ' + PREFIX + 'sticker (reply image)',
                    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
                    '',
                    '╭━━〔 ⚙️ sᴇᴛᴛɪɴɢs ⚙️ 〕━━╮',
                    '┃ ◈ ' + PREFIX + 'setprefix <symbol>',
                    '┃ ◈ ' + PREFIX + 'alwaysonline on/off',
                    '┃ ◈ ' + PREFIX + 'statusview on/off',
                    '┃ ◈ ' + PREFIX + 'autoreact on/off',
                    '┃ ◈ ' + PREFIX + 'autodl on/off',
                    '┃ ◈ ' + PREFIX + 'update',
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