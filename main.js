import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

import { setupPriceCommands } from './price.checker.js';
import { setupChartCommands } from './charts.js';
// import { setupAlertCommands } from './alerts.js';


const bot = new Telegraf(process.env.BOT_TOKEN);

// Вызываем функции, которые принимают объект бота и регистрируют команды/хэндлеры
setupPriceCommands(bot);
setupChartCommands(bot);
//setupAlertCommands(bot);

bot.launch().then(()=> {
    console.log('Bot started!');
});