import {Telegraf} from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
import Database from 'better-sqlite3'
dotenv.config({path: './config/.env'});

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// URL и заголовки для получения курса через CoinMarketCap API
const COINMARKETCAP_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
const COINMARKETCAP_API_KEY = process.env.CMC_API_KEY;
console.log(BOT_TOKEN, COINMARKETCAP_API_KEY);

// Инициализируем или открываем базу данных
const db = new Database('database/alerts.db');

// Создаём таблицу для хранения уведомлений, если её нет
db.exec(`
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    threshold REAL NOT NULL
);
`);

// Функция добавления уведомления в БД
function addAlert(chatId, symbol, threshold) {
    const stmt = db.prepare('INSERT INTO alerts (chat_id, symbol, threshold) VALUES (?, ?, ?)');
    stmt.run(chatId, symbol, threshold);
}

// Получение всех уведомлений из БД
function getAllAlerts() {
    const stmt = db.prepare('SELECT * FROM alerts');
    return stmt.all();
}

// Удаление уведомлений по списку ID
function deleteAlertsByIds(ids) {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM alerts WHERE id IN (${placeholders})`);
    stmt.run(...ids);
}

export function setupAlertCommands(bot) {
    bot.command('alert', (ctx) => {
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) {
            return ctx.reply('Использование: /alert SYMBOL PRICE\nПример: /alert BTC 30000');
        }

        const symbol = args[0].toUpperCase();
        const threshold = parseFloat(args[1]);
        if (isNaN(threshold)) {
            return ctx.reply('Цена должна быть числом.');
        }

        // Сохраняем алерт в БД
        addAlert(ctx.chat.id, symbol, threshold);
        ctx.reply(`Уведомление установлено: оповестить, если цена ${symbol} достигнет $${threshold}`);
    });

    // Запускаем периодическую проверку
    setInterval(() => checkAlerts(bot), 10 * 1000);
}

// Функция для проверки цен и отправки уведомлений
async function checkAlerts(bot) {
    const alerts = getAllAlerts();
    if (alerts.length === 0) return;

    const uniqueSymbols = [...new Set(alerts.map(a => a.symbol))];
    const symbolParam = uniqueSymbols.join(',');

    try {
        const response = await axios.get(COINMARKETCAP_URL, {
            params: { symbol: symbolParam },
            headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY }
        });

        const data = response.data.data;
        const triggered = [];

        for (const alert of alerts) {
            const info = data[alert.symbol];
            if (info) {
                const currentPrice = info.quote.USD.price;
                if (currentPrice >= alert.threshold) {
                    triggered.push(alert);
                }
            }
        }

        // Отправляем уведомления
        for (const t of triggered) {
            await bot.telegram.sendMessage(t.chat_id,
                `Уведомление: цена ${t.symbol} достигла $${t.threshold}!\nCейчас торгуется по цене ~ $${data[t.symbol].quote.USD.price.toFixed(2)}`
            );
        }

        // Удаляем сработавшие уведомления из БД
        if (triggered.length > 0) {
            const ids = triggered.map(t => t.id);
            deleteAlertsByIds(ids);
        }

    } catch (error) {
        console.error('Ошибка при проверке цен для уведомлений:', error);
    }
}