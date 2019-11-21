/**
 * Originally made by nitrojs (yougame.biz/threads/73701)
 * Modififed, recoded & updated by aeonixlegit (github.com/aeonixlegit)
 */

const debug = require('debug')('vk-autocomment:main')

const path = require('path')
global.appDir = path.dirname(require.main.filename)

const Utils = global.U = require('./utils')
const fs = require('fs')

const logo = [
  ' ▌ ▐·▄ •▄      ▄▄▄· ▄• ▄▌▄▄▄▄▄       ▄▄·       • ▌ ▄ ·. • ▌ ▄ ·. ▄▄▄ . ▐ ▄ ▄▄▄▄▄',
  '▪█·█▌█▌▄▌▪    ▐█ ▀█ █▪██▌•██  ▪     ▐█ ▌▪▪     ·██ ▐███▪·██ ▐███▪▀▄.▀·•█▌▐█•██  ',
  '▐█▐█•▐▀▀▄·    ▄█▀▀█ █▌▐█▌ ▐█.▪ ▄█▀▄ ██ ▄▄ ▄█▀▄ ▐█ ▌▐▌▐█·▐█ ▌▐▌▐█·▐▀▀▪▄▐█▐▐▌ ▐█.▪',
  ' ███ ▐█.█▌    ▐█ ▪▐▌▐█▄█▌ ▐█▌·▐█▌.▐▌▐███▌▐█▌.▐▌██ ██▌▐█▌██ ██▌▐█▌▐█▄▄▌██▐█▌ ▐█▌·',
  '. ▀  ·▀  ▀     ▀  ▀  ▀▀▀  ▀▀▀  ▀█▄▀▪·▀▀▀  ▀█▄▀▪▀▀  █▪▀▀▀▀▀  █▪▀▀▀ ▀▀▀ ▀▀ █▪ ▀▀▀ ',
].join('\n')

const loadingmessages = {
  init: [
    '> l o a d i n g',
    '> Тестируем физику облаков...',
    '> Крадём ваши данные...',
    '> undefined',
    "> Нажмите 'ALT + F4' для продолжения",
    '> Error 404: Обновление не найдено',
    '> Взламываем пентагон...',
    '> Генерируем местность...',
    '> Подготавливаем цветовую схему...',
    '> Просматриваем историю браузера...',
    '> Божечки-кошечки!',
    '> Я думаю, Вы помните о том, что нужно использовать токен от Kate Mobile.',
    '> Подменяем вашу операционную систему...',
    '> Отключаемся от интернета...',
    '> Возрождение мертвого клиента...',
    '> Публикация данных ваших карт...',
  ],
}

/**
 * @param {array} array - Массив с объектами
 */

const getRandomItemFromArray = (array) => array[Math.round((array.length - 1) * Math.random())]

/**
 * Блок отображения загрузки.
 */

console.log(
  [
    logo,
    '',
    getRandomItemFromArray(loadingmessages.init),
  ].join('\n'),
)

/**
 * Блок инициализации.
 */

Utils.initConfigs()

const readlineSync = require('readline-sync')
readlineSync.setDefaultOptions({ encoding: 'utf8' })

const chalk = require('chalk')

const { VK } = require('vk-io')

const vk = new VK({
  apiMode: 'parallel_selected',
  apiExecuteMethods: ['groups.join'],
  apiHeaders: { 'User-Agent': '' },
})

let { token, group_link, ignore_links, links, messages, attachments, autosubscribe, like, comment, likecomment, time } = fs.existsSync(path.join(process.cwd(), './config.json')) ? global.safeRequire(path.join(process.cwd(), './config.json'), true) : {}

const posts = {
  liked: [],
  commented: [],
}

let intervalTTL = false

/**
 * Блок основного функционала.
 */

async function init () {
  debug('Устанавливаю токен ВКонтакте')
  vk.setOptions({
    token: token,
  })

  debug('Обрабатываю ссылки ВКонтакте')
  links = await Promise.all(links.map(async (link) => {
    try {
      debug(`Обрабатываю [${link}]`)
      const result = await vk.snippets.resolveResource(link)
      if (!result || (result.type !== 'group' && result.type !== 'user' && result.type !== 'event')) throw new Error(`Ссылка [${link}] должна вести на группу, пользователя или мероприятие.`)
      return (result.type === 'group' || result.type === 'event') ? -result.id : result.id
    } catch (e) {
      console.error(`${chalk.red('!')} Ошибка при обработке ссылки [${link}], перепроверьте её.`)
    }
  }))

  if (group_link && group_link !== '') {
    const result = await vk.snippets.resolveResource(group_link)
    group_link = result.type === 'group' ? result.id : 0
  }

  group_link = group_link == null ? 0 : group_link

  vk.captchaHandler = async ({ src }, retry) => {
    const result = captchaHandler(src)

    try {
      await retry(result)
      console.log(`${chalk.green('!')} Капча введена успешно.`)
    } catch (e) {
      console.error(`${chalk.red('!')} Ошибка при вводе капчи.`)
    }
  }

  if (autosubscribe) {
    await Promise.all([
      vk.api.groups.get({
        count: 1000,
      }).then((resp, err) => {
        if (err) throw err
        links.filter((x) => { return x < 0 }).map(async (group) => {
          if (!resp.items.includes(Math.abs(group))) {
            try {
              await vk.api.groups.join({
                group_id: Math.abs(group),
              })
              console.log(`${chalk.blue('!')} Пользователь был автоматически подписан на группу [club${Math.abs(group)}].`)
            } catch (e) {
              const errors = {
                10: 'Внутренняя ошибка ВКонтакте (попробуйте позже)',
                15: 'Доступ запрещён (скорее всего, пользователь находится в чёрном списке)',
                103: 'Превышено ограничение на количество вступлений',
              }
              const error = errors[e.code] || 'Неизвестная ошибка'
              console.error(chalk.red(`Ошибка: ${error} [${e.code}]`))
            }
          }
        })
      }),
    ])
  }

  console.clear()
  console.log([
    chalk.white.bold(logo),
    '',
    `${chalk.blue('!')} VK AutoComment был запущен.`,
  ].join('\n'))
  if (!like && !comment) {
    console.error(`${chalk.red('!')} Необходимо включить хотя-бы одну функцию для работы программы.`)
    process.exit(0)
  }

  if (time < 100) {
    time = 100
    console.log(`${chalk.red('!')} Интервал для обновления ленты был меньше 100 миллисекунд, в связи с этим он автоматические был установлен на 100 миллисекунд`)
  }

  intervalTTL && clearInterval(intervalTTL)
  intervalTTL = setInterval(async _ => {
    const lastWallPost = (await vk.api.newsfeed.get({ filters: 'post', count: 1 })).items[0]

    if (!ignore_links && !links.includes(lastWallPost.source_id)) return

    if (!posts.commented.includes(`${lastWallPost.source_id}${lastWallPost.post_id}`) && comment) {
      posts.commented.push(`${lastWallPost.source_id}${lastWallPost.post_id}`)
      try {
        const message = getRandomItemFromArray(messages)
        const attachment = getRandomItemFromArray(attachments)
        if (message) {
          debug(`Отправляю в комментарии к записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}] сообщение с текстом [${message}]`)
          const { comment_id } = (await vk.api.wall.createComment({ owner_id: lastWallPost.source_id, from_group: group_link, post_id: lastWallPost.post_id, message: message, attachments: attachment }))
          console.log(`${chalk.green('!')} Был написан комментарий под записью [wall${lastWallPost.source_id}_${lastWallPost.post_id}] с текстом [${message}]${attachments.length > 0 ? ` и вложением [${attachment}]` : ''}.`)
          if (likecomment) {
            try {
              await vk.api.likes.add({
                type: 'comment',
                owner_id: lastWallPost.source_id,
                item_id: comment_id,
              })
              console.log(`${chalk.green('!')} Был установлен лайк под отправленным комментарием [wall${lastWallPost.source_id}_${lastWallPost.post_id}].`)
            } catch (e) {
              console.error(chalk.red(`Ошибка: Неизвестная ошибка [${e.code}]`))
            }
          }
        }
      } catch (e) {
        const errors = {
          10: 'Внутренняя ошибка ВКонтакте (попробуйте позже)',
          15: 'Доступ запрещён (возможно, в группе от имени которой отправляется комментарий у аккаунта нет роли редактора)',
          213: 'Нет доступа к комментированию записи (возможно, комментарии были закрыты)',
          222: 'Запрещённые гиперссылки',
          223: 'Превышен лимит комментариев на стене',
        }

        const error = errors[e.code] || 'Неизвестная ошибка'

        console.error(chalk.red(`Ошибка: ${error} [${e.code}]`))
      }
    }

    if (!posts.liked.includes(`${lastWallPost.source_id}${lastWallPost.post_id}`) && like) {
      posts.liked.push(`${lastWallPost.source_id}${lastWallPost.post_id}`)
      try {
        debug(`Ставлю лайк записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}]`)
        await vk.api.likes.add({
          type: 'post',
          owner_id: lastWallPost.source_id,
          item_id: lastWallPost.post_id,
        })
        console.log(`${chalk.green('!')} Был установлен лайк записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}].`)
      } catch (e) {
        const errors = {
          10: 'Внутренняя ошибка ВКонтакте (попробуйте позже)',
          30: 'Профиль закрытый',
        }

        const error = errors[e.code] || 'Неизвестная ошибка'

        console.error(chalk.red(`Ошибка: ${error} [${e.code}]`))
      }
    }
  }, time)

  setInterval(ads, 600000)
}

/**
 * Блок обработки капчи.
 */

function captchaHandler (source) {
  console.log(chalk.yellow(`> Была получена капча [${source}]`))
  const result = readlineSync.question(`${chalk.red.bold('>')} `)
  return result
}

/**
 * Блок отображения рекламы.
 *
 * Наличие рекламы в бесплатном приложении - признак его долгой поддержки.
 */

let adscount = 0
const adsmessages = [
  `${chalk.yellow('!')} Благодарность - лучшее, что может услышать разработчик скрипта.`,
  `${chalk.yellow('!')} Не забудьте оставить отзыв в теме форума, где Вы нашли данный скрипт или поставить Star на GitHub`,
  `${chalk.yellow('!')} Вы можете заказать разработку бота по своему тех. заданию в Telegram -> ${chalk.white.bold('@aeonixlegit')}`,
  `${chalk.yellow('!')} Вы можете поддержать разработчика используя donation alerts -> ${chalk.white.bold('donationalerts.com/r/aeonixlegit')}`,
  `${chalk.yellow('!')} Всегда проверяйте обновления на GitHub, ведь обновление может выйти с минуты на минуту с необходимым для Вас функционалом.`,
  `${chalk.yellow('!')} Наличие рекламы в бесплатном приложении - признак его долгой поддержки.`,
]

function ads () {
  console.log(adsmessages[adscount % adsmessages.length])
  adscount++
}

init().catch(console.error)
