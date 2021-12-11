import { vk } from './vk/bot';
import { bot } from './telegram/bot'


const mode = process.argv[2].toUpperCase();


(async (): Promise<void> => {
    if (mode === "--VK")
        await vk.updates.start();
    else if (mode === "--TG")
        await bot.updates.startPolling();
})().then(
    (): void => {
        if (mode === "--VK")
            console.log(`[VK] started polling`);
        else if (mode === "--TG")
            console.log(`[Puregram] started polling`);
    }
);
