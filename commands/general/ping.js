module.exports = {
    name: 'ping',
    aliases: ['ping1', 'ping2', 'ping3', 'ping4', 'ping5'],
    category: 'general',
    description: 'Check bot response',
    async execute({ reply }) {
        const started = Date.now();
        await reply('🏓 *VFX MINI PONG!*\n⚡ Status: Online\n🟢 Ready to use');
        const elapsed = Date.now() - started;
        console.log('[VFX MINI] Ping command replied in', elapsed, 'ms');
    }
};
