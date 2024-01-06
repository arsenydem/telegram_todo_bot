const { Telegraf, Markup, Scenes, session, Composer } = require('telegraf')

let mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/telegram-bot');

let recordSchema = new mongoose.Schema({
    text: String,
    userId: String,
    time: String
},
    {
        timestamps: true
    }
);
var Record = mongoose.model('record', recordSchema);

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
        await ctx.replyWithHTML(`<b>Отлично! Теперь напиши через сколько часов, минут и секунд ты хочешь создать напоминание\nПример:\n1:12:30</b>`)
        return ctx.wizard.next()
    } catch (e) {
        console.log(e)
    }
})

const cityStep = new Composer()
cityStep.on("text", async (ctx) => {
    ctx.wizard.state.data.time = ctx.message.text.toString()
    try {
        try {
            const [hours, minutes, seconds] = ctx.wizard.state.data.time.split(':');
            if (hours && minutes && seconds) {
                let record = new Record({
                    text: ctx.wizard.state.data.title,
                    userId: ctx.wizard.state.data.id,
                    time: ctx.wizard.state.data.time
                });
                await record.save();
                const time = (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
                setTimeout(() => {
                    ctx.reply('🔔')
                    ctx.replyWithHTML(`<b>Вот твоя заметка:</b>\n <blockquote>${ctx.wizard.state.data.title}</blockquote>`);
                }, time);
                ctx.replyWithHTML(`<b>Заметка успешно добавлена!. Я напомню о ней через ${hours} часов, ${minutes} минут, ${seconds} секунд.</b>`);
            } else {
                ctx.replyWithHTML('Введённый формат времени неправильный.', Markup.keyboard(
                    [
                        [Markup.button.callback('Составить заметку заново', 'btn_1')],
                        [Markup.button.callback('Меню', 'btn_1')]
                    ]).oneTime().resize())
            }
        } catch (e) {
            console.log(e)
            ctx.replyWithHTML('<b>Введённый формат времени неправильный.</b>');
        }
        return ctx.scene.leave()
    } catch (e) {
        console.log(e)
        ctx.replyWithHTML('<b>Произошла ошибка при добавлении заметки.</b>');
    }
})

const newtodoScene = new Scenes.WizardScene('todolistWizard', startStep, titleStep, cityStep)
module.exports = { newtodoScene, Record }