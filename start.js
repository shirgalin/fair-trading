import {Telegraf} from "telegraf";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config({path: './config/.env'});

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

const commands = fs.readFileSync('commands.txt', 'utf8');
export function setupStartCommands(bot) {
    bot.command('start', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length === 0) {
            return ctx.reply('Привет 👋! Я бот для трейдинга в Telegram. Я нахожусь в разработке, ' +
                `поэтому у меня пока мало функций, но я активно развиваюсь 😊.\nКоманды:\n${ commands }`);
        }
    });
}