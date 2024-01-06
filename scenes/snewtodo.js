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
        ctx.replyWithHTML('<b>Напиши текст заметки</b>', Markup.removeKeyboard())
        return ctx.wizard.next()
    } catch (e) {
        console.log(e)
    }
})

const titleStep = new Composer()
titleStep.on("text", async (ctx) => {
    try {
        ctx.wizard.state.data.title = ctx.message.text
        await ctx.replyWithHTML(`<b>Отлично! Теперь напиши когда ты хочешь увидеть напоминание\nПример:\n05.01.2024 13:50</b>`)
        return ctx.wizard.next()
    } catch (e) {
        console.log(e)
    }
})

const cityStep = new Composer()
cityStep.on("text", async (ctx) => {
    ctx.wizard.state.data.time = ctx.message.text.toString()
    try {
        // Разбиваем время на день, месяц, год, часы и минуты
        const [date, time] = ctx.wizard.state.data.time.split(" ");
        const [day, month, year] = date.split(".");
        const [hours, minutes] = time.split(":");
        var now = new Date();
        var daynow = ("0" + now.getDate()).slice(-2);
        var monthnow = ("0" + (now.getMonth() + 1)).slice(-2);
        var yearnow = now.getFullYear();
        var hoursnow = ("0" + now.getHours()).slice(-2);
        var minutesnow = ("0" + now.getMinutes()).slice(-2);
        // Запланировать отправку заметки по расписанию
        if ((year && day && month && hours && minutes) && (Number(year) - Number(yearnow)) >= 0 &&  (Number(month) - Number(monthnow)) >= 0  && (Number(day) - Number(daynow)) >= 0  && (Number(hours) - Number(hoursnow)) >= 0  && (Number(minutes) - Number(minutesnow)) >= 0) {
            let record = new Record({
                text: ctx.wizard.state.data.title,
                userId: ctx.wizard.state.data.id,
                time: ctx.wizard.state.data.time
            });
            await record.save();
            const time2 = (parseInt(Number(year) - Number(yearnow)) * 31536000 + parseInt(Number(month) - Number(monthnow)) * 2592000 + parseInt(Number(day) - Number(daynow)) * 86400 + parseInt(Number(hours) - Number(hoursnow)) * 3600 + parseInt(Number(minutes) - Number(minutesnow)) * 60) * 1000;
            setTimeout(() => {
                ctx.reply('🔔')
                ctx.replyWithHTML(`<b>Вот твоя заметка:</b>\n <blockquote>${ctx.wizard.state.data.title}</blockquote>`);
            }, time2);
            ctx.replyWithHTML(`<b>Заметка успешно добавлена! Я напомню тебе ${ctx.wizard.state.data.time}.</b>`);
        } else {
            ctx.replyWithHTML('<b>Введённый формат времени неправильный!</b>', Markup.keyboard(
                [
                    [Markup.button.callback('Составить заметку заново', 'btn_1')],
                    [Markup.button.callback('Меню', 'btn_2')]
                ]).oneTime().resize())
        }
    } catch (e) {
        console.log(e)
        ctx.replyWithHTML('<b>Введённый формат времени неправильный!</b>', Markup.keyboard(
            [
                [Markup.button.callback('Составить заметку заново', 'btn_1')],
                [Markup.button.callback('Меню', 'btn_2')]
            ]).oneTime().resize())
    }
    return ctx.scene.leave()
})

const snewtodoScene = new Scenes.WizardScene('stodolistWizard', startStep, titleStep, cityStep)
module.exports = { snewtodoScene, Record }