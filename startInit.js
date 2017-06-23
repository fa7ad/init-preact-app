const del = require('del')
const pify = require('pify')
const path = require('path')
const colors = require('colors')
const download = require('download')
const mkdirp = pify(require('mkdirp'))
const jsonf = pify(require('jsonfile'))
const decompress = require('decompress')
const cp = pify(require('child_process'))

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
  return decompress(path.join(appRoot, 'preact.zip'), cwd)
}

module.exports = function (cwd, opts) {
  const { force, offline, pm, verbose: vb } = opts
  const offlag = offline ? ['--offline'] : []
  const insflag = pm === 'npm' ? ['install', '--save'] : ['add']
  const devflag = pm === 'npm' ? ['install', '--save-dev'] : ['add', '--dev']
  mkdirp(cwd)
    .then(dir => {
      if (!dir) {
        log('Target directory exists'.e)
        if (force) {
          log('--force'.w, 'flag passed'.x)
          return del(path.join(cwd, '*'), { force: true }).then(() => {
            log('Deleted the contents of'.red, `${cwd}`.w)
          })
        } else {
          log(
            'Launch with'.le,
            '--force'.w,
            'to delete the directory content'.le
          )
          process.exit(1)
        }
      }
    })
    .then(() => extractTemplate(cwd, offline))
    .then(() => {
      log('Creating package.json')
      process.chdir(cwd)
      return cp.execFile(pm, ['init', '-y'].concat(offlag))
    })
    .then((out, err) => {
      vb && process.stdout.write(out)
      vb && err && process.stderr.write(err)
      const deps = ['preact', 'preact-compat']
      log('Installing dependencies:', deps.join(', ').w)
      return cp.execFile(pm, [...insflag, ...deps, ...offlag])
    })
    .then((out, err) => {
      vb && process.stdout.write(out)
      vb && err && process.stderr.write(err)
      const devdeps = ['neutrino', 'neutrino-preset-preact']
      log('Installing dev-dependencies:', devdeps.join(', ').w)
      return cp.execFile(pm, [...devflag, ...devdeps, ...offlag])
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
      log('Done initializing app!'.cyan.bold)
      log('')
      log('Now run:'.cyan)
      log('cd'.w, cwd.w)
      log(pm.replace('pkg', '').w, 'start'.italic.w)
      log('')
      log('Happy coding!'.rainbow.bold, String.fromCodePoint(0x1F60A).bgBlack.yellow)
    })
    .catch(err => console.error(err.message || err))
}
