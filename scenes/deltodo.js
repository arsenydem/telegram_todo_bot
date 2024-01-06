const { Telegraf, Markup, Scenes, session, Composer } = require('telegraf')


let mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/telegram-bot');

const { Record } = require('./newtodo.js')

const startStep = new Composer()
startStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data = {}
        ctx.wizard.state.data.userName = ctx.message.from.username
        ctx.wizard.state.data.id = ctx.message.from.id.toString()
        ctx.wizard.state.data.firstName = ctx.message.from.first_name
        ctx.wizard.state.data.lastName = ctx.message.from.last_name
        let todos = await Record.find({ userId: ctx.message.from.id.toString()})
        let s = `<b>Вот твои заметки:</b>`
        if (todos.length >= 1) {
            ctx.replyWithHTML('<b>Напиши номер заметки, которую ты хочешь удалить!\nПример: \n2 </b>', Markup.removeKeyboard())
            for (let i = 0; i < todos.length; i++) {
                if (todos[i].time.includes(' ')) {
                    s += `\n`
                    s += (`${i + 1}. ` + `<blockquote>` + todos[i].text + `</blockquote>` + `<b>Дата: </b>` + todos[i].time)
                } else {
                    s += `\n`
                    s += (`${i + 1}. ` + `<blockquote>` + todos[i].text + `</blockquote>` + `<b>Таймер: </b>` + todos[i].time)
                }
            }
            await ctx.replyWithHTML(`${s}`)
            return ctx.wizard.next()
        } else {
            await ctx.replyWithHTML(`<b>У вас пока нет заметок</b>`, Markup.keyboard(
                [
                    [Markup.button.callback('Составить новую заметку', 'btn_1')],
                    [Markup.button.callback('Меню', 'btn_2')]
                ]).oneTime().resize())
            return ctx.scene.leave()
        }
    } catch (e) {
        console.log(e)
    }
})

const titleStep = new Composer()
titleStep.on("text", async (ctx) => {
    let todos = await Record.find({ userId: ctx.wizard.state.data.id})
    ctx.wizard.state.data.number = ctx.message.text
    try {
        if (todos[ctx.wizard.state.data.number - 1]) {
            await Record.deleteOne({_id: todos[ctx.wizard.state.data.number - 1]._id});
            await ctx.replyWithHTML(`<b>Заметка удалена!</b>`)
        } else {
            ctx.replyWithHTML('<b>Введённый формат номера неправильный!</b>', Markup.keyboard(
                [
                    [Markup.button.callback('Составить новую заметку', 'btn_1')],
                    [Markup.button.callback('Меню', 'btn_2')],
                    [Markup.button.callback('Удалить заметку заново', 'btn_3')]
                ]).oneTime().resize())
        }
    } catch (e) {
        ctx.replyWithHTML('<b>Введённый формат номера неправильный!</b>', Markup.keyboard(
            [
                [Markup.button.callback('Составить новую заметку', 'btn_1')],
                [Markup.button.callback('Меню', 'btn_2')],
                [Markup.button.callback('Удалить заметку заново', 'btn_3')]
            ]).oneTime().resize())
        console.error(e)
    }
    return ctx.scene.leave()
})

const delnewtodoScene = new Scenes.WizardScene('deltodolistWizard', startStep, titleStep)
module.exports = { delnewtodoScene, Record }