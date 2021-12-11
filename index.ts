const mode = process.argv[2].toUpperCase();


(async (): Promise<void> => {
    if (mode === "--VK") {
        const { vk } = require('./vk/bot');
        await vk.updates.start();
    }
    else if (mode === "--TG") {
        const { bot } = require('./telegram/bot');
        await bot.updates.startPolling();
    }
})().then(
    (): void => {
        if (mode === "--VK")
            console.log(`[VK] started polling`);
        else if (mode === "--TG")
            console.log(`[Puregram] started polling`);
    }
);
