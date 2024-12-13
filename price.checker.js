import {Telegraf} from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config({path: './config/api.env'});

const BOT_TOKEN = process.env.BOT_TOKEN; 
const bot = new Telegraf(BOT_TOKEN);

// URL и заголовки для получения курса через CoinMarketCap API
const COINMARKETCAP_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
const COINMARKETCAP_API_KEY = process.env.CMC_API_KEY;
console.log(BOT_TOKEN, COINMARKETCAP_API_KEY);

function formatPrice(value) {
    if (value >= 1) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    else if (value >= 0.00001) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 6,
            maximumFractionDigits: 6
        }).format(value);
    }
    else {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 5,
            maximumFractionDigits: 5
        }).format(value);
    }
}

export function setupPriceCommands(bot) {
    bot.command('price', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length === 0) {
            return ctx.reply('Использование: /price SYMBOL\nНапример: /price BTC');
        }

        const symbol = args[0].toUpperCase();

        try {
            const response = await axios.get(COINMARKETCAP_URL, {
                params: { symbol: symbol },
                headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY }
            });

            if (response.data.data && response.data.data[symbol]) {
                const price = response.data.data[symbol].quote.USD.price;
                const formattedPrice = formatPrice(price);
                
                ctx.reply(`Текущий курс ${symbol}: $${formattedPrice}`);
            } else {
                ctx.reply(`Не удалось найти информацию о валюте ${symbol}. Убедитесь, что символ введён правильно.`);
            }
        } catch (error) {
            console.error('Ошибка получения данных из CoinMarketCap:', error);
            ctx.reply('Не удалось получить информацию о валюте 😔. Попробуйте позже.');
        }
    });
}