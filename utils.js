const debug = require('debug')('vk-autocomment:utils')

global.safeRequire = function safeRequire (module, terminate = false) {
  try {
    debug(`Подключаю модуль ${module}`)
    return require(module)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && ~err.message.indexOf(module)) {
      console.error(`\n! Файл [${module}] не найден.\n`)
    }
    else console.error(`\n! Ошибка при инициализации кода в файле [${module}]. Перепроверьте его!\n`)
    if (terminate) return process.exit(1)
  }
}

module.exports = {
  global,
}
