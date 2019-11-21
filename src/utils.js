const debug = require('debug')('vk-autocomment:utils')

function initConfigs () {
  const fs = require('fs-extra')
  const path = require('path')
  function init (name) {
    const customFile = path.join(process.cwd(), `./${name}.json`)
    const exampleFile = path.join(global.appDir, `./${name}.example.json`)
    if (!fs.existsSync(customFile)) {
      fs.copyFileSync(exampleFile, customFile)
    }
  }
  init('config')
}

global.safeRequire = function safeRequire (module, terminate = false) {
  try {
    debug(`Подключаю модуль ${module}`)
    return require(module)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && ~err.message.indexOf(module)) console.error(`\n! Файл [${module}] не найден.\n`)
    else console.error(`\n! Ошибка при инициализации кода в файле [${module}]. Перепроверьте его!\n`)
    if (terminate) return process.exit(1)
  }
}

Object.defineProperty(this, 'DEBUG', {
  get: () => process.env.NODE_ENV === 'development',
})
global.DEV = this.DEBUG
global.DEBUG = this.DEBUG
global.RELEASE = !this.DEBUG

Object.defineProperty(this, 'isNode', {
  get: () => process.argv[0].replace(/\.exe/g, '').endsWith('node'),
})
global.isNode = this.isNode

module.exports = {
  initConfigs,
}
