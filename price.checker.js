const { Telegraf } = require('telegraf');
const axios = require('axios');

const BOT_TOKEN = '7678597517:AAHh2Es_t41d6xT6h-3ngqulZHzivj3q64k'; // Замените YOUR_BOT_TOKEN на ваш токен
const bot = new Telegraf(BOT_TOKEN);

// URL и заголовки для получения курса через CoinMarketCap API
const COINMARKETCAP_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
const COINMARKETCAP_API_KEY = 'f87c4996-c124-455b-9b5d-4e0b1b99c56d';

// Команда /start
bot.start((ctx) => {
    ctx.reply(`Привет, ${ctx.from.first_name}! 👋\nНапиши мне тикер любой криптовалюты (например, BTC или ETH), и я покажу её текущий курс в USD.`);
});

// Обработчик сообщенийы
bot.on('text', async (ctx) => {
    const symbol = ctx.message.text.trim().toUpperCase(); // Получаем символ криптовалюты от пользователя

    try {
        const response = await axios.get(COINMARKETCAP_URL, {
            params: {
                symbol: symbol
            },
            headers: {
                'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY
            }
        });

        if (response.data.data && response.data.data[symbol]) {
            const price = response.data.data[symbol].quote.USD.price;
            ctx.reply(`Текущий курс ${symbol}: $${price.toFixed(2)}`);
        } else {
            ctx.reply(`Не удалось найти информацию о валюте с символом ${symbol}. Убедитесь, что символ введён правильно.`);
        }
    } catch (error) {
        console.error('Ошибка получения данных из CoinMarketCap:', error);
        ctx.reply('Не удалось получить информацию о валюте 😔. Попробуйте позже.');
    }
});

// Запуск бота
bot.launch().then(() => {
    console.log('Бот запущен!');
});

// Обработка сигналов для безопасного завершения
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
