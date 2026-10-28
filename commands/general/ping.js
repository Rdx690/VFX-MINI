module.exports = {
  name: 'ping',
  aliases: ['ping1', 'ping2', 'ping3', 'ping4', 'ping5'],
  category: 'general',
  description: 'Check bot response',
  async execute({ reply }) {
    const started = Date.now();
    await reply('🏓 *VFX MINI PONG!*\n⚡ Status: Online\n🟢 Ready to use');
    console.log('[VFX MINI] Ping command took', Date.now() - started, 'ms');
  }
};
