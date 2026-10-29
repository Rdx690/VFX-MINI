// VFX MINI website routes extracted from index.js.
// Keep the main pairing API in index.js; this module only serves the UI and logo.
module.exports = function registerWebsite(app, axios) {
app.get('/brand-logo', async (req, res) => {
    try {
        const page = await axios.get('https://ibb.co/HL6Ftn8P', {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = String(page.data || '');
        const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (!match || !match[1]) return res.status(404).send('Logo image unavailable');
        return res.redirect(302, match[1].replace(/&amp;/g, '&'));
    } catch (err) {
        console.error('Brand logo fetch failed:', err.message);
        return res.status(502).send('Logo temporarily unavailable');
    }
});

let sock = null;

/* ============================================================
   🔥 VFX MINI — PREMIUM PAIRING PORTAL (NEW STYLE)
   ============================================================ */
app.get('/faq', (req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#050b18"><title>VFX MINI • FAQ & How to Use</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 15% 0%,#063b68 0,transparent 35%),radial-gradient(ellipse at 100% 15%,#20115a 0,transparent 35%),#050b18;color:#edf6ff;font-family:Inter,system-ui,sans-serif}
.wrap{width:min(900px,calc(100% - 28px));margin:auto}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:22px 0}.brand{font:800 17px Orbitron,sans-serif;letter-spacing:.04em}.brand span{color:#32dcff}.back{color:#dffaff;text-decoration:none;border:1px solid #24506d;border-radius:12px;padding:10px 13px;font-size:13px}
.hero{padding:26px 0 18px}.eyebrow{color:#36dfff;font-size:11px;font-weight:800;letter-spacing:.18em}h1{font:800 clamp(28px,6vw,44px) Orbitron,sans-serif;line-height:1.2;margin:12px 0;background:linear-gradient(100deg,#fff,#64e8ff,#a99bff);color:transparent;background-clip:text}.muted{color:#9fb1cb;line-height:1.7;font-size:14px}
.card{background:linear-gradient(145deg,#111d31ed,#091322f2);border:1px solid #203e5e;border-radius:20px;padding:20px;margin:14px 0;box-shadow:0 18px 55px #0004}.card h2{font-size:17px;margin:0 0 10px}.step{display:flex;gap:13px;margin:15px 0}.num{flex:0 0 30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#10364b;color:#6ceaff;font-weight:800}.step p{margin:2px 0;color:#b9c9df;font-size:14px;line-height:1.65}.step b{color:#f4f8ff}.qa{border-top:1px solid #20334c;padding:14px 0}.qa:first-of-type{border-top:0}.qa h3{font-size:14px;margin:0 0 7px}.qa p{font-size:13px;color:#aebfd7;line-height:1.7;margin:0}.warn{border-color:#6c4d2b}.warn h2{color:#ffd38a}.footer{text-align:center;color:#657b9b;font-size:11px;padding:24px 0 36px}
</style></head><body><div class="wrap"><header class="top"><div class="brand"><span>VFX</span> MINI <small style="display:block;font:500 10px Inter;color:#91a5c1;margin-top:5px">FAQ • HOW TO USE</small></div><a class="back" href="/"><i class="fa-solid fa-arrow-left"></i> Back to Pairing</a></header>
<section class="hero"><div class="eyebrow">QUICK START GUIDE</div><h1>How to use VFX MINI</h1><p class="muted">Follow these steps to request a WhatsApp linking code. Only connect a WhatsApp account that you own or are authorised to manage.</p></section>
<section class="card"><h2><i class="fa-solid fa-link" style="color:#4de4ff"></i> Pairing steps</h2>
<div class="step"><span class="num">1</span><p><b>Open the Pairing Portal.</b><br>Go back to the home page and enter your phone number with country code, digits only (for example, India: 91 followed by your number).</p></div>
<div class="step"><span class="num">2</span><p><b>Tap “GET PAIRING CODE”.</b><br>Wait for the server to respond. If it says the bot is starting, wait a few seconds and try once more.</p></div>
<div class="step"><span class="num">3</span><p><b>Open WhatsApp on your phone.</b><br>Go to Settings or the three-dot menu → Linked devices → Link a device. If offered, choose “Link with phone number instead”.</p></div>
<div class="step"><span class="num">4</span><p><b>Enter the code in WhatsApp.</b><br>Use the code shown on this website. Never share your pairing code or QR with anyone.</p></div>
<div class="step"><span class="num">5</span><p><b>Wait for connection confirmation.</b><br>If pairing fails, verify the number format and server status. Do not repeatedly request codes or delete session files.</p></div>
</section>
<section class="card"><h2><i class="fa-solid fa-circle-question" style="color:#a99bff"></i> Frequently asked questions</h2>
<div class="qa"><h3>Is the pairing code my WhatsApp password?</h3><p>No. It is a temporary device-linking code. Treat it as private because someone else could use it to link a device.</p></div>
<div class="qa"><h3>Why is no code appearing?</h3><p>The server may be starting, offline, or already linked. Refresh once, wait a few seconds, and check the Koyeb deployment logs if the problem continues.</p></div>
<div class="qa"><h3>What if WhatsApp says the code is invalid?</h3><p>Request a fresh code and enter it promptly. Make sure the number includes the country code and contains digits only.</p></div>
<div class="qa"><h3>Will my session survive a redeploy?</h3><p>Only if the bot's authentication data is stored on a correctly configured persistent volume or other persistent storage. A deployment without persistent storage may lose local session files.</p></div>
<div class="qa"><h3>Can this guarantee my WhatsApp account won't be banned?</h3><p>No. This is an unofficial WhatsApp Web integration, and account restrictions cannot be ruled out. Use responsibly and follow WhatsApp's terms.</p></div>
<div class="qa"><h3>What does the .faq command do?</h3><p>In chats where the bot is connected, send <b>.faq</b> to receive a short guide. This website page is also available at <b>/faq</b>.</p></div>
</section>
<section class="card warn"><h2><i class="fa-solid fa-shield-halved"></i> Safety reminder</h2><p class="muted">Never share pairing codes, QR images, or session files. Only link your own account. A bot cannot guarantee uninterrupted service or prevent every account restriction.</p></section>
<div class="footer">VFX MINI • Powered by SOURAJIT VFX</div></div></body></html>`);
});

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
            .logo-badge img{width:46px;height:46px;object-fit:contain;border-radius:50%;filter:drop-shadow(0 0 8px rgba(0,229,255,.6));}
            .logo-badge span{
                font-family:'Orbitron',sans-serif;font-weight:700;
                font-size:18px;letter-spacing:3px;
                background:linear-gradient(90deg,var(--primary),var(--secondary));
                -webkit-background-clip:text;background-clip:text;
                -webkit-text-fill-color:transparent;
            }
            @media(max-width:480px){.logo-badge{padding:9px 16px;gap:9px}.logo-badge img{width:38px;height:38px}.logo-badge span{font-size:16px;letter-spacing:2px}}

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

            .copy-code-btn{
                margin-top:14px;padding:11px 16px;border-radius:10px;border:1px solid rgba(0,229,255,.55);
                color:var(--primary);background:rgba(0,229,255,.09);font-weight:700;letter-spacing:1px;
                cursor:pointer;box-shadow:0 0 14px rgba(0,229,255,.12);transition:all .2s ease
            }
            .copy-code-btn:active{transform:scale(.97)}
            .copy-hint{font-size:11px;color:var(--muted);margin-top:10px}
            .music-toggle{
                position:fixed;right:16px;bottom:18px;z-index:200;display:flex;align-items:center;gap:9px;
                border:1px solid rgba(0,229,255,.5);border-radius:999px;padding:12px 16px;
                color:#fff;background:rgba(7,10,20,.88);backdrop-filter:blur(14px);
                box-shadow:0 0 20px rgba(0,229,255,.18);font-weight:700;cursor:pointer
            }
            .music-toggle i{color:var(--primary)}
            .music-toggle.playing{border-color:rgba(255,46,136,.75);box-shadow:0 0 24px rgba(255,46,136,.25)}
            .music-toggle.playing i{color:#ff2e88}
            .music-note{position:fixed;right:18px;bottom:76px;z-index:199;color:#9ba8bb;font-size:10px;letter-spacing:1px}

            /* ============ VFX MINI OPENING SPLASH ============ */
            .opening-splash{
                position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:24px;overflow:hidden;
                background:#020308;color:#fff;opacity:1;visibility:visible;
                transition:opacity .75s ease,visibility .75s ease;
            }
            .opening-splash::before{
                content:'';position:absolute;inset:0;pointer-events:none;
                background-image:linear-gradient(rgba(0,229,255,.045) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(0,229,255,.045) 1px,transparent 1px);
                background-size:48px 48px;mask-image:radial-gradient(circle,black 20%,transparent 85%);
                animation:splashGrid 12s linear infinite;
            }
            .opening-splash::after{
                content:'';position:absolute;width:min(78vw,360px);aspect-ratio:1;border-radius:50%;
                background:radial-gradient(circle,rgba(0,229,255,.17),rgba(168,85,247,.08) 45%,transparent 70%);
                filter:blur(8px);animation:splashAura 2.4s ease-in-out infinite;
            }
            .opening-splash.hide{opacity:0;visibility:hidden;pointer-events:none}
            .splash-orbit{
                position:relative;z-index:1;width:min(58vw,230px);aspect-ratio:1;border-radius:50%;
                display:grid;place-items:center;border:2px solid rgba(0,229,255,.65);
                box-shadow:0 0 22px rgba(0,229,255,.35),inset 0 0 25px rgba(168,85,247,.16);
                animation:orbitPulse 2s ease-in-out infinite;
            }
            .splash-orbit::before,.splash-orbit::after{
                content:'';position:absolute;inset:-13px;border-radius:50%;
                border:1px dashed rgba(168,85,247,.9);animation:orbitSpin 8s linear infinite;
            }
            .splash-orbit::after{inset:-24px;border:3px solid transparent;border-top-color:#00e5ff;border-bottom-color:#ff2e88;animation:orbitSpin 3s linear infinite}
            .splash-logo{
                width:76%;height:76%;object-fit:contain;border-radius:50%;position:relative;z-index:2;
                filter:drop-shadow(0 0 12px rgba(0,229,255,.55));
                animation:splashLogoIn .9s cubic-bezier(.2,.9,.3,1.2) both;
            }
            .splash-title{
                position:relative;z-index:1;font-family:'Orbitron',sans-serif;font-weight:900;
                font-size:clamp(30px,8vw,54px);letter-spacing:clamp(3px,1.5vw,8px);
                text-align:center;text-shadow:0 0 24px rgba(0,229,255,.4);
                animation:splashTitleIn .8s .2s both;
            }
            .splash-title span{color:var(--primary);text-shadow:0 0 18px rgba(0,229,255,.7)}
            .splash-credit{position:relative;z-index:1;color:#9ba8bb;font-size:11px;letter-spacing:4px;text-align:center;animation:splashTitleIn .8s .4s both}
            .splash-loader{position:relative;z-index:1;width:130px;height:3px;border-radius:10px;background:#17202b;overflow:hidden}
            .splash-loader span{display:block;width:45%;height:100%;border-radius:10px;background:linear-gradient(90deg,var(--primary),var(--secondary),var(--accent));box-shadow:0 0 12px var(--primary);animation:splashLoad 1.35s ease-in-out infinite}
            @keyframes orbitSpin{to{transform:rotate(360deg)}}
            @keyframes orbitPulse{0%,100%{box-shadow:0 0 22px rgba(0,229,255,.35),inset 0 0 25px rgba(168,85,247,.16)}50%{box-shadow:0 0 42px rgba(168,85,247,.55),inset 0 0 35px rgba(0,229,255,.2)}}
            @keyframes splashAura{0%,100%{transform:scale(.88);opacity:.6}50%{transform:scale(1.08);opacity:1}}
            @keyframes splashLogoIn{from{opacity:0;transform:scale(.72) rotate(-8deg)}to{opacity:1;transform:scale(1) rotate(0)}}
            @keyframes splashTitleIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
            @keyframes splashLoad{0%{transform:translateX(-120%)}100%{transform:translateX(340%)}}
            @keyframes splashGrid{to{background-position:48px 48px}}
            @media(prefers-reduced-motion:reduce){
                .opening-splash *,.opening-splash::before,.opening-splash::after{animation:none!important}
            }

        </style>
    </head>
    <body>
        <div class="opening-splash" id="openingSplash" aria-label="VFX MINI loading">
            <div class="splash-orbit">
                <img class="splash-logo" src="https://d2jqrm6oza8nb6.cloudfront.net/datasets/5ae724ac-6064-4f04-936c-bce595f85e8f.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYWFmNjU2MjcwNWIwYTBhOCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MzM2ODIzMX0.Fpt-v87pW_dC7qhuBtkA6MfQQ5hXqORSXM4xT8bJDqU" alt="Sourajit profile photo" style="width:76%;height:76%;object-fit:cover;object-position:center 25%;border-radius:50%;position:relative;z-index:2;border:2px solid rgba(0,229,255,.75);box-shadow:0 0 18px rgba(0,229,255,.45);" fetchpriority="high">
            </div>
            <div class="splash-title">VFX <span>MINI</span></div>
            <div class="splash-credit">POWERED BY SOURAJITVFX</div>
            <div class="splash-loader" aria-hidden="true"><span></span></div>
        </div>

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
                <li><a href="/faq"><i class="fa-solid fa-book"></i> FAQ / How to use</a></li>
                <li><a href="#"><i class="fa-solid fa-headset"></i> Support</a></li>
            </ul>
            <button class="hamburger" id="hamburger"><i class="fa-solid fa-bars"></i></button>
        </nav>

        <!-- ============ MAIN CARD ============ -->
        <div class="main-wrap">
            <div class="card" id="mainCard">
                <div class="logo-badge">
                    <img src="/brand-logo" alt="VFX MINI logo" onerror="this.style.display='none'">
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
                    <div class="label">Your Linked Device Code</div>
                    <h2 id="pairCode" title="Tap to copy" role="button" tabindex="0" onclick="copyPairCode()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();copyPairCode();}">-----</h2>
                    <button type="button" class="copy-code-btn" id="copyCodeBtn" onclick="copyPairCode()"><i class="fa-regular fa-copy"></i> TAP TO COPY CODE</button>
                    <p class="copy-hint" id="copyHint">Tap the code or button to copy it</p>
                </div>

                <div class="dev-credits">
                    <div class="dev"><i class="fa-solid fa-code"></i> <b>SOURAJITVFX</b></div>
                    <div class="dev"><i class="fa-solid fa-robot"></i> <b>RAHUL AI</b></div>
                </div>
            </div>
        </div>

        <div class="music-note" id="musicNote">VFX MINI • MUSIC READY</div>
        <audio id="phonkAudio" autoplay preload="auto" loop playsinline>
            <source src="https://www.image2url.com/r2/default/audio/1792553400781-eed61433-8ccd-4ef1-9492-ada715b288c9.mp3" type="audio/mpeg">
        </audio>
        <button class="music-toggle" id="musicToggle" type="button" onclick="togglePhonk()" aria-pressed="false">
            <i class="fa-solid fa-music"></i><span id="musicToggleText">PLAY MUSIC</span>
        </button>

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

            // ---------- Pairing code tap-to-copy ----------
            async function copyPairCode() {
                const code = (document.getElementById('pairCode').innerText || '').trim();
                const hint = document.getElementById('copyHint');
                const btn = document.getElementById('copyCodeBtn');
                if (!code || code === '-----') {
                    if (hint) hint.textContent = 'Generate a pairing code first.';
                    return;
                }
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(code);
                    } else {
                        const field = document.createElement('textarea');
                        field.value = code;
                        field.style.position = 'fixed';
                        field.style.opacity = '0';
                        document.body.appendChild(field);
                        field.select();
                        const copied = document.execCommand('copy');
                        field.remove();
                        if (!copied) throw new Error('Copy not supported');
                    }
                    if (hint) hint.textContent = '✓ Code copied! Open WhatsApp > Linked devices.';
                    if (btn) btn.innerHTML = '<i class="fa-solid fa-check"></i> COPIED';
                } catch (err) {
                    if (hint) hint.textContent = 'Copy blocked by browser. Long-press the code to copy it.';
                }
            }

            // ---------- User-provided phonk music ----------
            const phonkAudio = document.getElementById('phonkAudio');
            let phonkPlaying = false;
            async function togglePhonk() {
                const button = document.getElementById('musicToggle');
                const label = document.getElementById('musicToggleText');
                const note = document.getElementById('musicNote');
                if (!phonkAudio || !button || !label || !note) return;
                try {
                    if (phonkPlaying) {
                        phonkAudio.pause();
                        phonkPlaying = false;
                        button.classList.remove('playing');
                        button.setAttribute('aria-pressed', 'false');
                        label.textContent = 'PLAY MUSIC';
                        note.textContent = 'MUSIC PAUSED';
                        return;
                    }
                    await phonkAudio.play();
                    phonkPlaying = true;
                    button.classList.add('playing');
                    button.setAttribute('aria-pressed', 'true');
                    label.textContent = 'STOP MUSIC';
                    note.textContent = 'VFX MINI • MUSIC PLAYING';
                } catch (err) {
                    note.textContent = 'Tap PLAY MUSIC again or check audio link';
                    console.error('Music playback failed:', err);
                }
            }

            // Try autoplay on page load. Browsers may block audible autoplay until a user gesture.
            (function setupMusicAutoplay() {
                const audio = document.getElementById('phonkAudio');
                const button = document.getElementById('musicToggle');
                const label = document.getElementById('musicToggleText');
                const note = document.getElementById('musicNote');
                if (!audio) return;
                audio.autoplay = true;
                audio.loop = true;
                audio.preload = 'auto';
                const syncPlayingUI = () => {
                    if (button) { button.classList.add('playing'); button.setAttribute('aria-pressed', 'true'); }
                    if (label) label.textContent = 'STOP MUSIC';
                    if (note) note.textContent = 'VFX MINI • MUSIC PLAYING';
                };
                const tryAutoplay = () => audio.play().then(syncPlayingUI).catch(() => {
                    if (note) note.textContent = 'Tap anywhere or PLAY MUSIC to start audio';
                });
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', tryAutoplay, { once: true });
                } else {
                    tryAutoplay();
                }
                const resumeAfterGesture = () => {
                    if (audio.paused) tryAutoplay();
                    if (!audio.paused) {
                        document.removeEventListener('pointerdown', resumeAfterGesture);
                        document.removeEventListener('keydown', resumeAfterGesture);
                    }
                };
                document.addEventListener('pointerdown', resumeAfterGesture, { passive: true });
                document.addEventListener('keydown', resumeAfterGesture);
            })();

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
        <script>
            (function () {
                const splash = document.getElementById('openingSplash');
                if (!splash) return;
                let alreadyShown = false;
                try { alreadyShown = sessionStorage.getItem('vfxMiniSplashShown') === '1'; } catch (_) {}
                if (alreadyShown) {
                    splash.remove();
                    return;
                }
                try { sessionStorage.setItem('vfxMiniSplashShown', '1'); } catch (_) {}
                window.setTimeout(() => {
                    splash.classList.add('hide');
                    window.setTimeout(() => splash.remove(), 800);
                }, 3000);
            })();
        </script>
    </body>
    </html>
    `);
});
};
