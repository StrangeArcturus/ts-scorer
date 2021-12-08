import { vk } from './bot';


(async (): Promise<void> => {
    await vk.updates.start();
})().then(
    (): void => console.log(`[VK] started polling`)
);
