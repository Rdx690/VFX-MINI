module.exports = {
    name: 'uptime',
    category: 'general',
    description: 'Show bot uptime',
    async execute({ reply }) {
        const seconds = Math.floor(process.uptime());
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;
        await reply('⏱️ *VFX MINI UPTIME*\n' + days + 'd ' + hours + 'h ' + minutes + 'm ' + remainder + 's');
    }
};
