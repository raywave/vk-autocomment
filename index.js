/**
 * Originally made by nitrojs (yougame.biz/threads/73701)
 * Modififed, recoded & updated by aeonixlegit (github.com/aeonixlegit)
 */

const debug = require('debug')('vk-autocomment:main')
const Utils = global.U = require('./utils')
const fs = require('fs')

const { version } = require('./package.json')

const logo = [
  ' ▌ ▐·▄ •▄      ▄▄▄· ▄• ▄▌▄▄▄▄▄       ▄▄·       • ▌ ▄ ·. • ▌ ▄ ·. ▄▄▄ . ▐ ▄ ▄▄▄▄▄',
  '▪█·█▌█▌▄▌▪    ▐█ ▀█ █▪██▌•██  ▪     ▐█ ▌▪▪     ·██ ▐███▪·██ ▐███▪▀▄.▀·•█▌▐█•██  ',
  `▐█▐█•▐▀▀▄·    ▄█▀▀█ █▌▐█▌ ▐█.▪ ▄█▀▄ ██ ▄▄ ▄█▀▄ ▐█ ▌▐▌▐█·▐█ ▌▐▌▐█·▐▀▀▪▄▐█▐▐▌ ▐█.▪ [${version}]`,
  ' ███ ▐█.█▌    ▐█ ▪▐▌▐█▄█▌ ▐█▌·▐█▌.▐▌▐███▌▐█▌.▐▌██ ██▌▐█▌██ ██▌▐█▌▐█▄▄▌██▐█▌ ▐█▌·',
  '. ▀  ·▀  ▀     ▀  ▀  ▀▀▀  ▀▀▀  ▀█▄▀▪·▀▀▀  ▀█▄▀▪▀▀  █▪▀▀▀▀▀  █▪▀▀▀ ▀▀▀ ▀▀ █▪ ▀▀▀ ',
].join('\n')

const loadingmessages = fs.existsSync('./loadingmessages.json') ? global.safeRequire('./loadingmessages.json') : {}

/**
 * @param {array} array - Массив с объектами
 */

let getRandomItemFromArray = (array) => array[Math.round((array.length - 1) * Math.random())]

/**
 * Блок отображения загрузки.
 */

console.log(
  [
    logo,
    '',
    getRandomItemFromArray(loadingmessages.init),
  ].join('\n')
)

/**
 * Блок инициализации.
 */

const readlineSync = require('readline-sync')
readlineSync.setDefaultOptions({ encoding: 'utf8' })

const chalk = require('chalk')

const { VK } = require('vk-io')
let vk = new VK()

let { token, group_link, links, messages, attachments, autosubscribe, like, comment, likecomment, time } = fs.existsSync('./config.json') ? global.safeRequire('./config.json') : {}

let posts = {
  liked: [],
  like_error: [],
  commented: [],
  commet_error: [],
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
    debug(`Обрабатываю [${link}]`)
    let result = await vk.snippets.resolveResource(link)
    if (!result || (result.type !== 'group' && result.type !== 'user')) throw new Error(`Ссылка [${link}] должна вести на группу или пользователя.`)
    return result.type === 'group' ? -result.id : result.id
  }))

  if (group_link && group_link !== '') {
    let result = await vk.snippets.resolveResource(group_link)
    group_link = result.type === 'group' ? result.id : 0
  }

  // == null проверяет на null и undefined
  // === null проверяет на null
  group_link = group_link == null ? 0 : group_link

  vk.captchaHandler = async ({ src }, submit) => {
    const result = await captchaHandler(src)

    try {
      await submit(result)
      console.log(`${chalk.green('>')} Капча введена успешно.`)
    } catch (e) {
      console.error(`${chalk.red('>')} Ошибка при вводе капчи.`)
    }
  }

  if (autosubscribe) {
    await Promise.all([
      vk.api.groups.get({
        count: 1000,
      }).then((resp, err) => {
        if (err) throw err
        links.filter(function (x) { return x < 0 }).map(async (group) => {
          if (!resp.items.includes(Math.abs(group))) {
            try {
              await vk.api.groups.join({
                group_id: Math.abs(group),
              })
              console.log(`${chalk.blue('>')} Пользователь был автоматически подписан на группу [club${Math.abs(group)}].`)
            } catch (e) {
              let errors = {
                15: 'Доступ запрещён (скорее всего, пользователь находится в чёрном списке)',
                103: 'Превышено ограничение на количество вступлений',
              }
              let error = errors[e.code] || 'Неизвестная ошибка'
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
    `${chalk.blue('>')} VK AutoComment был запущен.`,
  ].join('\n'))
  if (!like && !comment) {
    console.error(`${chalk.red('>')} Необходимо включить хотя-бы одну функцию для работы программы.`)
    process.exit(0)
  }

  if (time < 100) {
    time = 100
    console.log(`${chalk.red('>')} Интервал для обновления ленты был меньше 100 миллисекунд, в связи с этим он автоматические был установлен на 100 миллисекунд`)
  }

  intervalTTL && clearInterval(intervalTTL)
  intervalTTL = setInterval(async _ => {
    let lastWallPost = (await vk.api.newsfeed.get({ filters: 'post', count: 1 })).items[0]

    if (!links.includes(lastWallPost.source_id)) return

    if (!posts.commented.includes(`${lastWallPost.source_id}${lastWallPost.post_id}`) && !posts.commet_error.includes(`${lastWallPost.source_id}${lastWallPost.post_id}`) && comment) {
      try {
        let message = getRandomItemFromArray(messages)
        let attachment = getRandomItemFromArray(attachments)
        if (message) {
          debug(`Отправляю в комментарии к записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}] сообщение с текстом [${message}]`)
          let { comment_id } = (await vk.api.wall.createComment({ owner_id: lastWallPost.source_id, from_group: group_link, post_id: lastWallPost.post_id, message: message, attachments: attachment }))
          posts.commented.push(`${lastWallPost.source_id}${lastWallPost.post_id}`)
          console.log(`${chalk.green('>')} Был написан комментарий под записью [wall${lastWallPost.source_id}_${lastWallPost.post_id}] с текстом [${message}]${attachments.length > 0 ? ` и вложением [${attachment}]` : ''}.`)
          if (likecomment) {
            try {
              await vk.api.likes.add({
                type: 'comment',
                owner_id: lastWallPost.source_id,
                item_id: comment_id,
              })
              console.log(`${chalk.green('>')} Был установлен лайк под отправленным комментарием [wall${lastWallPost.source_id}_${lastWallPost.post_id}].`)
            } catch (e) {
              console.error(chalk.red(`Ошибка: Неизвестная ошибка [${e.code}]`))
            }
          }
        }
      } catch (e) {
        let errors = {
          15: 'Доступ запрещён (возможно, в группе от имени которой отправляется комментарий у аккаунта нет роли редактора)',
          213: 'Нет доступа к комментированию записи (возможно, комментарии были закрыты)',
          222: 'Запрещённые гиперссылки',
          223: 'Превышен лимит комментариев на стене',
        }

        let error = errors[e.code] || 'Неизвестная ошибка'

        posts.commet_error.push(`${lastWallPost.source_id}${lastWallPost.post_id}`)

        console.error(chalk.red(`Ошибка: ${error} [${e.code}]`))
      }
    }

    if (!posts.liked.includes(`${lastWallPost.source_id}${lastWallPost.post_id}`) && !posts.like_error.includes(`${lastWallPost.source_id}${lastWallPost.post_id}`) && like) {
      try {
        debug(`Ставлю лайк записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}]`)
        await vk.api.likes.add({
          type: 'post',
          owner_id: lastWallPost.source_id,
          item_id: lastWallPost.post_id,
        })
        posts.liked.push(`${lastWallPost.source_id}${lastWallPost.post_id}`)
        console.log(`${chalk.green('>')} Был установлен лайк записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}].`)
      } catch (e) {
        let errors = {
          30: 'Профиль закрытый',
        }

        let error = errors[e.code] || 'Неизвестная ошибка'

        posts.like_error.push(`${lastWallPost.source_id}${lastWallPost.post_id}`)
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
  let result = readlineSync.question(`${chalk.red.bold('>')} `)
  return result
}

/**
 * Блок отображения рекламы.
 *
 * Наличие рекламы в бесплатном приложении - признак его долгой поддержки.
 */

let adscount = 0
let adsmessages = [
  `${chalk.yellow('!')} Не забудьте оставить отзыв в теме форума, где Вы нашли данный скрипт или поставить Star на GitHub`,
  `${chalk.yellow('!')} Вы можете поддержать разработчика на patreon -> ${chalk.white.bold('patreon.com/aeonixlegit')} / donation alerts -> ${chalk.white.bold('donationalerts.com/r/aeonixlegit')}`,
  `${chalk.yellow('!')} Вы можете заказать разработку своего бота -> ${chalk.white.bold('vk.me/aeonix')}`,
  `${chalk.yellow('!')} Всегда проверяйте обновления на GitHub, ведь обновление может выйти с минуты на минуту с необходимым для Вас функционалом.`,
  `${chalk.yellow('!')} Наличие рекламы в бесплатном приложении - признак его долгой поддержки.`,
]

function ads () {
  console.log(adsmessages[adscount % adsmessages.length])
  adscount++
}

init().catch(console.error)
