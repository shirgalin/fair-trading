import fetch from "node-fetch";
import QuickChart from "quickchart-js";
import {Telegraf} from "telegraf"
import dotenv from "dotenv";
import { format } from 'date-fns';
dotenv.config({path: './config/.env'});

const BOT_TOKEN = process.env.BOT_TOKEN;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const bot = new Telegraf(BOT_TOKEN);

console.log(BOT_TOKEN, COINGECKO_API_KEY);

export function setupChartCommands(bot) {
    const coinMapping = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'DOGE': 'dogecoin',
        'TON': 'toncoin',
    };

    bot.command('chart', async (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) {
            return ctx.reply('Использование: /chart SYMBOL PERIOD\nНапример: /chart BTC 24h');
        }

        const symbol = args[0].toUpperCase();
        const period = args[1].toLowerCase(); // '24h', '7d', 30d и т.д.

        let days;
        if (period === '24h' || period === '1d') days = 1;
        else if (period === '7d') days = 7;
        else if (period === '30d') days = 30;
        else {
            return ctx.reply('Неверный период. Попробуйте 24h, 7d или 30d.');
        }

        const coinId = coinMapping[symbol];
        if (!coinId) {
            return ctx.reply('Неизвестный символ. Добавьте в маппинг или убедитесь в правильности тикера.');
        }

        try {
            const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
            const response = await fetch(url);
            const data = await response.json();

            const prices = data.prices;
            if (!prices || prices.length === 0) {
                return ctx.reply('Не удалось получить данные для графика.');
            }

            const labels = prices.map(p => format(new Date(p[0]), 'MM.dd HH:mm'));
            const values = prices.map(p => p[1]);

            const stride = Math.ceil(values.length / 200);
            const sampledLabels = labels.filter((_, i) => i % stride === 0);
            const sampledValues = values.filter((_, i) => i % stride === 0);

            const qc = new QuickChart();
            qc.setConfig({
                type: 'line',
                data: {
                    labels: sampledLabels,
                    datasets: [{
                        text: `${symbol} (USD) за ${days} дней`,
                        data: sampledValues,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false,
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${symbol} за период ${period}`,
                        }
                    }
                }
            });
            qc.setWidth(800).setHeight(400).setBackgroundColor('white');
            qc.setFormat('png');
            
            const shortUrl = await qc.getShortUrl();
            console.log('График URL:', shortUrl);
            ctx.replyWithPhoto({ url: shortUrl }, { caption: `График ${symbol} за период ${period}` });
        } catch (error) {
            console.error('Ошибка при получении графика:', error);
            ctx.reply('Ошибка при получении данных графика');
        }
    });
}