import {Telegraf} from "telegraf";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config({path: './config/.env'});

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

const commands = fs.readFileSync('commands.txt', 'utf8');
export function setupHelpCommands(bot) {
    bot.command('help', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length === 0) {
            return ctx.reply(`Команды:\n${ commands }`, 'Если бот не работает - @fairtradingsupport');
        }
    });
}