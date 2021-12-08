import { MessageContext, VK } from 'vk-io';

import { TOKEN, TEST_TOKEN } from './config';
import { handle_message } from './handle_bot';
import { AsyncDataBaseConnector } from './db/connector';

const isTest: boolean = process.argv[2] === "--test";

console.log(`[VK] bot started in ${isTest ? 'test' : 'product'} mode`);

export const vk: VK = new VK({
    token: isTest ? TEST_TOKEN : TOKEN,
    language: 'ru'
});
console.log(`[VK] bot inited with token ${isTest ? TEST_TOKEN : TOKEN}`)
export const connector: AsyncDataBaseConnector = new AsyncDataBaseConnector("./db/data.db", "vk");


vk.updates.on("message_new", async (context: MessageContext): Promise<void> => {
    let user_id: string | number = context.senderId;
    let answer: string;
    try {
        await connector.add_user(user_id);
    } catch {
        console.log("Упс, что-то пошло не так");
    }
    let text: string | undefined = context?.text;
    if (text) {
        console.log(`get message:\n${text}`)
        answer = await handle_message(text, user_id);
        console.log(`send answer:\n${answer}`);
        await context.send( answer );
    }
});
