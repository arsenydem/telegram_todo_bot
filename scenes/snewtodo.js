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
        await ctx.replyWithHTML(`<b>Отлично! Теперь напиши когда ты хочешь увидеть напоминание (в своём часовом поясе) и свой часовой пояс\nПример:\n05.01.2024 13:50 UTC+3</b>`)
        return ctx.wizard.next()
    } catch (e) {
        console.log(e)
    }
})

const cityStep = new Composer()
cityStep.on("text", async (ctx) => {
    ctx.wizard.state.data.time = ctx.message.text.toString()
    try {
        // Разбиваем время на день, месяц, год, часы, минуты и пояс, чтобы составить строку time3
        const [date, time, poyas] = ctx.wizard.state.data.time.split(" ");
        const [day, month, year] = date.split(".");
        const [hours, minutes] = time.split(":");
        const [uts, number] = poyas.split("+");
        const time3 = `${month}.${day}.${year} ${time} ${poyas}`
        const currentDate = new Date();
        const userDate = new Date(time3)
        const secondsDiff = Number(userDate - currentDate);
        // Запланировать отправку заметки по расписанию
        if ((year && day && month && hours && minutes && (secondsDiff >= 0))) {
            let record = new Record({
                text: ctx.wizard.state.data.title,
                userId: ctx.wizard.state.data.id,
                time: ctx.wizard.state.data.time
            });
            await record.save();
            const maxIntValue = 2147483647;
            function startTimer(time) { //функция таймера с перезапуском, если значение миллисекунд больше, чем 2147483647
                if (time <= maxIntValue) {
                    setTimeout(() => {
                        ctx.reply('🔔')
                        ctx.replyWithHTML(`<b>Вот твоя заметка:</b>\n <blockquote>${ctx.wizard.state.data.title}</blockquote>`);
                    }, time);
                } else {
                    setTimeout(() => {
                        startTimer(time - maxIntValue);
                    }, maxIntValue);
                }
            }
            // Запускаем таймер
            startTimer(secondsDiff);
            ctx.replyWithHTML(`<b>Заметка успешно добавлена! Я напомню тебе ${ctx.wizard.state.data.time}</b>`);
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