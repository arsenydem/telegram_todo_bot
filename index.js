const { Telegraf, Markup, Scenes, session } = require('telegraf')
const { message } = require('telegraf/filters')
require('dotenv').config()
const text = require('./const')

let mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/telegram-bot');

const { newtodoScene } = require('./scenes/newtodo.js')
const { snewtodoScene } = require('./scenes/snewtodo.js')
const { delnewtodoScene } = require('./scenes/deltodo.js')

const bot = new Telegraf(process.env.BOT_TOKEN)

const { Record } = require('./scenes/newtodo.js')
const stage = new Scenes.Stage([newtodoScene, snewtodoScene, delnewtodoScene])

bot.use(session())
bot.use(stage.middleware())

phrases = ['Заметка по таймеру', 'Заметка по дате', 'Составить заметку заново', 'Составить новую заметку', 'Меню', 'Новая заметка', 'Мои заметки', '/new', '/my', '/start', '/help', '/support']


bot.start((ctx) => ctx.replyWithHTML(`<b>Привет</b>, ` + `<b>${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!</b>\n` + `<b>Будь как дома 💖</b>`, Markup.removeKeyboard()))
bot.help((ctx) => ctx.reply(text.commands, Markup.removeKeyboard()))



bot.command('new', async (ctx) => {
    try {
        await ctx.replyWithHTML('<b>Выбери тип заметки</b>', Markup.keyboard(
            [
                [Markup.button.callback('Заметка по таймеру', 'btn_1')],
                [Markup.button.callback('Заметка по дате', 'btn_2')]
            ]).oneTime().resize())
    } catch (e) {
        console.error(e)
    }
})

bot.command('my', async (ctx) => {
    try {
        let todos = await Record.find({ userId: ctx.message.from.id.toString() })
        let s = `<b>Вот твои заметки:</b>`
        if (todos.length >= 1) {
            for (let i = 0; i < todos.length; i++) {
                if (todos[i].time.includes(' ')) {
                    s += `\n`
                    s += (`${i + 1}. ` + `<blockquote>` + todos[i].text + `</blockquote>` + `Дата: ` + todos[i].time)
                } else {
                    s += `\n`
                    s += (`${i + 1}. ` + `<blockquote>` + todos[i].text + `</blockquote>` + `Таймер: ` + todos[i].time)
                }
            }
            await ctx.replyWithHTML(`${s}`, Markup.removeKeyboard())
        } else {
            await ctx.replyWithHTML(`<b>У вас пока нет заметок!</b>`, Markup.keyboard(
                [
                    [Markup.button.callback('Составить новую заметку', 'btn_1')],
                    [Markup.button.callback('Меню', 'btn_2')]
                ]).oneTime().resize())
        }
    } catch (e) {
        console.error(e)
    }
})

bot.command('delete', ctx => ctx.scene.enter('deltodolistWizard'))

bot.hears('Удалить заметку заново', ctx => {
    ctx.scene.enter('deltodolistWizard')
})

const youtubeButton = Markup.button.url('Поддержать', 'https://clck.ru/37VBvR');

bot.command('support', async (ctx) => {
    ctx.reply('Спасибо за поддержку ❤️', Markup.inlineKeyboard([youtubeButton]))
})

bot.hears('Заметка по таймеру', ctx => {
    ctx.scene.enter('todolistWizard')
})

bot.hears('Заметка по дате', ctx => {
    ctx.scene.enter('stodolistWizard')
})

bot.hears('Составить заметку заново', async (ctx) => {
    try {
        await ctx.replyWithHTML('<b>Выбери тип заметки</b>', Markup.keyboard(
            [
                [Markup.button.callback('Заметка по таймеру', 'btn_1')],
                [Markup.button.callback('Заметка по дате', 'btn_2')]
            ]).oneTime().resize())
    } catch (e) {
        console.error(e)
    }
})

bot.hears('Составить новую заметку', async (ctx) => {
    try {
        await ctx.replyWithHTML('<b>Выбери тип заметки</b>', Markup.keyboard(
            [
                [Markup.button.callback('Заметка по таймеру', 'btn_1')],
                [Markup.button.callback('Заметка по дате', 'btn_2')]
            ]).oneTime().resize())
    } catch (e) {
        console.error(e)
    }
})

bot.hears('Меню', ctx => {
    try {
        ctx.replyWithHTML('<b>Меню</b>', Markup.keyboard(
            [
                [Markup.button.callback('Новая заметка', 'btn_1')],
                [Markup.button.callback('Мои заметки', 'btn_2')]
            ]).oneTime().resize())
    } catch (e) {
        console.log(e)
    }
})

bot.hears('Новая заметка', ctx => {
    ctx.scene.enter('todolistWizard')
})

bot.hears('Мои заметки', async (ctx) => {
    try {
        let todos = await Record.find({ userId: ctx.message.from.id.toString() })
        let s = `<b>Вот твои заметки:</b>`
        if (todos.length >= 1) {
            for (let i = 0; i < todos.length; i++) {
                if (todos[i].time.includes(' ')) {
                    s += `\n`
                    s += (`${i + 1}. ` + `<blockquote>` + todos[i].text + `</blockquote>` + `Дата: ` + todos[i].time)
                } else {
                    s += `\n`
                    s += (`${i + 1}. ` + `<blockquote>` + todos[i].text + `</blockquote>` + `Таймер: ` + todos[i].time)
                }
            }
            await ctx.replyWithHTML(`${s}`, Markup.removeKeyboard())
        } else {
            await ctx.replyWithHTML(`<b>У вас пока нет заметок!</b>`, Markup.keyboard(
                [
                    [Markup.button.callback('Составить новую заметку', 'btn_1')],
                    [Markup.button.callback('Меню', 'btn_2')]
                ]).oneTime().resize())
        }
    } catch (e) {
        console.error(e)
    }
})

bot.on('text', (ctx) => {
    const userMessage = ctx.message.text
    // Проверяем, есть ли сообщение пользователя в массиве фраз
    if (!phrases.includes(userMessage)) {
        ctx.replyWithHTML('<b>Я вас не понимаю😥</b>');
    }
});


bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))