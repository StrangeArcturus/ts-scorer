import { MessageContext, Telegram } from 'puregram';

import { AsyncDataBaseConnector } from './db/connector';
import { handle_message } from './handle_bot';
import { TOKEN_TG as TOKEN } from "./config";


console.log(`[Puregram] bot started in product mode`);

export const bot: Telegram = new Telegram({
    token: TOKEN
});

console.log(`[Puregram] bot inited with token ${TOKEN}`);

export const connector: AsyncDataBaseConnector = new AsyncDataBaseConnector("./db/data.db", "tg");


bot.updates.on("message", async (context: MessageContext): Promise<void> => {
    let user_id: string | number | any = context?.chatId;
    let answer: string;
    let text: string | undefined = context?.text;
    try {
        await connector.add_user(user_id);
    } catch {
        console.log("Oops, smth goes wrong...");
    }
    if (text) {
        console.log(`get message:\n${text}`);
        answer = await handle_message(text, user_id);
        console.log(`send answer:\n${answer}`);
        await context.reply(answer);
    }
});
