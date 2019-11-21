const { compile } = require('nexe')
const path = require('path')
const fs = require('fs-extra')
const upx = require('upx')({
  best: true,
})

const appInfo = require(path.resolve(process.cwd(), 'package.json'))
const NODE_VER = '12.5.0'
const DIR_OUT = path.resolve('dist')
const DIR_COMPRESS = path.join(DIR_OUT, 'compressed')

function build (target) {
  const outName = `vk-autocomment_${target.replace('-', '-')}_v${appInfo.version}`
  console.log(`Building for '${target}' as '${outName}'`)
  process.nextTick(() => {
    compile({
      input: appInfo.input,
      // cwd: '',
      output: path.resolve(DIR_OUT, outName),
      target: `${target}-${NODE_VER}`,
      resources: ['package.json', 'src/*example.json'],
    }).then((data) => {
      console.log(`Built for ${target}`)
      process.nextTick(() => {
        compress(path.resolve(DIR_OUT, `${target === 'win-x86' ? `${outName}.exe` : `${outName}`}`))
      })
    })
  })
}

function compress (fileName) {
  console.log(`Compressing for '${fileName}'`)
  upx(fileName)
    .output(path.join(DIR_COMPRESS, path.basename(fileName)))
    .start()
    .then(() => console.log(`Compressed for '${fileName}'`))
}

fs.mkdirpSync(DIR_OUT)
fs.emptyDirSync(DIR_OUT)

fs.mkdirpSync(DIR_COMPRESS)
fs.emptyDirSync(DIR_COMPRESS)

Promise.all([
  build('win-x86'),
  build('linux-x86'),
  build('mac-x64'),
])
