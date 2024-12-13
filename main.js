import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

import { setupStartCommands } from './start.js';
import { setupHelpCommands } from './help.js';
import { setupPriceCommands } from './price.checker.js';
import { setupChartCommands } from './charts.js';
import { setupAlertCommands } from './price.alert.js';

const bot = new Telegraf(process.env.BOT_TOKEN);

try {
    // Вызываем функции, которые принимают объект бота и регистрируют команды/хэндлеры
    setupStartCommands(bot);
    setupHelpCommands(bot);
    setupPriceCommands(bot);
    setupChartCommands(bot);
    setupAlertCommands(bot);
}

catch (error) {
    console.error('Ошибка инициализации:', error);
    ctx.reply('Ошибка инициализации бота 😔. Попробуйте позже.');
}

// Обработка сообщений и неизвестных команд
bot.on('message', (ctx) => {
    const text = ctx.message.text;
    if (text && text.startsWith('/')) {
        // Если сообщение начинается с '/', скорее всего это неизвестная команда
        ctx.reply('Неизвестная команда. Попробуйте /help, чтобы узнать доступные команды.');
    } else {
        // Это не команда, а просто сообщение
        ctx.reply('Я не знаю, что на это ответить. Попробуйте /help.');
    }
});

bot.launch().then(()=> {
    console.log('Bot started!');
});