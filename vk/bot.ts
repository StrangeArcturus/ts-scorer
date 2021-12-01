import { VK } from 'vk-io';

import { TOKEN, TEST_TOKEN } from './config';

const isTest: boolean = process.argv[2] === "--test";

export const vk: VK = new VK({
    token: isTest ? TEST_TOKEN : TOKEN,
    language: 'ru'
});
