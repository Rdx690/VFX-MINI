module.exports = {
    name: 'restart',
    aliases: ['reboot', 'reload'],
    category: 'owner',
    description: 'Reconnect WhatsApp without deleting the session',
    ownerOnly: true,
    async execute({ reply, restartBot }) {
        await reply('🔄 *VFX MINI RESTARTING*\nWhatsApp will reconnect. Session files will be preserved.');
        await restartBot();
    }
};
