/**
 * Originally made by nitrojs (yougame.biz/threads/73701)
 * Modififed by aeonixlegit (github.com/aeonixlegit)
 */

const debug = require('debug')('vk-autocomment:main')
const Utils = global.U = require('./utils')

const { VK } = require('vk-io')
const fs = require('fs')
let vk = new VK()

let { token, links, messages, time } = fs.existsSync('./config.json') ? global.safeRequire('./config.json') : {}

let liked = []
let commented = []

let generateRandomMessage = (array) => array[Math.round((array.length - 1) * Math.random())]

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

  if (time < 100) {
    time = 100
  }

  setInterval(async _ => {
    let lastWallPost = (await vk.api.newsfeed.get({ filters: 'post', count: 1 })).items[0]

    if (!links.includes(lastWallPost.source_id)) return

    if (!commented.includes(lastWallPost.post_id)) {
      try {
        let message = generateRandomMessage(messages)
        if (message) {
          debug(`Отправляю в комментарии к записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}] сообщение с текстом [${message}]`)
          await vk.api.wall.createComment({ owner_id: lastWallPost.source_id, post_id: lastWallPost.post_id, message })
          commented.push(lastWallPost.post_id)
          console.log(`> Был написан комментарий под записью [wall${lastWallPost.source_id}_${lastWallPost.post_id}] с текстом [${message}].`)
        }
      } catch (e) {
        let errors = {
          213: 'Нет доступа к комментированию записи (возможно, комментарии были закрыты)',
          222: 'Запрещённые гиперссылки',
          223: 'Превышен лимит комментариев на стене',
        }

        let error = errors[e.code] || 'Неизвестная ошибка'

        throw new Error(error)
      }
    }

    if (!liked.includes(lastWallPost.post_id)) {
      try {
        debug(`Ставлю лайк записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}]`)
        await vk.api.likes.add({
          type: 'post',
          owner_id: lastWallPost.source_id,
          item_id: lastWallPost.post_id,
        })
        liked.push(lastWallPost.post_id)
        console.log(`> Был установлен лайк записи [wall${lastWallPost.source_id}_${lastWallPost.post_id}].`)
      } catch (e) {
        let errors = {
          30: 'Профиль закрытый',
        }

        let error = errors[e.code] || 'Неизвестная ошибка'

        throw new Error(error)
      }
    }
  }, time)

  console.log('> VK Auto Comment Bot был запущен.')
}

init().catch(console.error)
