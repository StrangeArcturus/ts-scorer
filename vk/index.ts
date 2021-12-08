import { vk } from './bot';

const mode = process.argv[2];


(async (): Promise<void> => {
    if (mode === "--VK")
        await vk.updates.start();
    else if (mode === "--TG")
        {}
})().then(
    (): void => {
        if (mode === "--VK")
            console.log(`[VK] started polling`);
        else if (mode === "--TG")
            {}
    }
);
