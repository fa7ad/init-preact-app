const del = require('del')
const pify = require('pify')
const path = require('path')
const colors = require('colors')
const glob = pify(require('glob'))
const download = require('download')
const mkdirp = pify(require('mkdirp'))
const jsonf = pify(require('jsonfile'))
const decompress = require('decompress')
const cp = pify(require('child_process'))

const { resolve, join } = path

colors.setTheme({
  le: 'red',
  e: ['red', 'bold'],
  i: ['green', 'italic'],
  n: 'green',
  x: 'yellow',
  w: ['yellow', 'bold'],
  oo: 'rainbow'
})

const appRoot = __dirname
const downloadUri = 'http://fahad.gq/preact.zip'
const log = (...text) => {
  const logs = [...text].map(a => colors.green(a))
  console.log(...logs)
}

function extractTemplate (cwd, offline) {
  log('Extracting template into', cwd.w, '\n')
  if (!offline) return download(downloadUri, cwd, { extract: true })
  return decompress(join(appRoot, 'preact.zip'), cwd)
}

const pmAdd = (pm = 'npm', dev = false) =>
  (dev
    ? pm === 'npm' ? ['install', '--save-dev'] : ['add', '--dev']
    : pm === 'npm' ? ['install', '--save'] : ['add'])

module.exports = function (cwd, opts) {
  const { force, offline, pm, verbose: vb } = opts
  const off = offline ? ['--offline'] : []
  cwd = resolve(cwd)

  mkdirp(cwd)
    .then(
      dir =>
        (!dir || cwd === resolve('.')
          ? glob(join(cwd, '**'))
              .then(d => d.filter(i => !/\.git/.test(i)))
              .then(f => f.length < 1)
          : true)
    )
    .then(ok => {
      if (!ok) log('Target directory exists and is not empty'.e)
      if (!ok && force) {
        log('--force'.w, 'flag passed'.x)
        return del(join(cwd, '*'), { force }).then(() =>
          log('Deleted the contents of'.red, `${cwd}`.w)
        )
      }
      if (!ok && !force) {
        log('Launch with'.le, '--force'.w, 'to delete the directory content'.le)
        process.exit(1)
      }
    })
    .then(() => extractTemplate(cwd, offline))
    .then(() => {
      log('Creating package.json')
      process.chdir(cwd)
      return cp.execFile(pm, ['init', '-y'].concat(off))
    })
    .then((out, err) => {
      vb && process.stdout.write(out)
      vb && err && process.stderr.write(err)
      const deps = ['preact', 'preact-compat']
      log('Installing dependencies:', deps.join(', ').w)
      return cp.execFile(pm, [...pmAdd(pm), ...deps, ...off])
    })
    .then((out, err) => {
      vb && process.stdout.write(out)
      vb && err && process.stderr.write(err)
      const devdeps = ['neutrino', 'neutrino-preset-preact']
      log('Installing dev-dependencies:', devdeps.join(', ').w)
      return cp.execFile(pm, [...pmAdd(pm, true), ...devdeps, ...off])
    })
    .then((out, err) => {
      vb && process.stdout.write(out)
      vb && err && process.stderr.write(err)
      log('Modifying package.json')
      return jsonf.readFile('./package.json', 'utf8')
    })
    .then(json =>
      Object.assign(json, {
        description: 'A preact app',
        neutrino: { use: ['neutrino-preset-preact'] },
        scripts: {
          start: 'neutrino start',
          build: 'neutrino build',
          test: 'neutrino test'
        }
      })
    )
    .then(data => jsonf.writeFile('./package.json', data, { spaces: 2 }))
    .then(() => {
      cwd = path.relative('.', cwd) || '.'
      log('Done initializing app!'.cyan.bold)
      log('')
      log('Now run:'.cyan)
      cwd !== '.' && log('cd'.w, cwd.w)
      log(pm.replace('pkg', '').w, 'start'.italic.w)
      log('')
      log('Happy coding!'.rainbow.bold, String.fromCodePoint(0x1f60a).rainbow)
    })
    .catch(err => console.error(err.message || err))
}
