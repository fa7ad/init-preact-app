#!/usr/bin/env node
const dns = require('dns')
const colors = require('colors')
const cp = require('child_process')
const program = require('commander')
const initApp = require('./init_app')

colors.setTheme({
  hi: ['yellow', 'italic'],
  err: ['red', 'bold']
})

let cwd

function checkIfOffline () {
  return new Promise(resolve => {
    dns.lookup('registry.npmjs.org', err => {
      resolve(err !== null)
    })
  })
}

function choosePackageManager () {
  return new Promise(resolve => {
    cp.execFile('yarnpkg', ['--version'], err => {
      if (err && err.code === 'ENOENT') resolve('npm')
      resolve('yarnpkg')
    })
  })
}

console.log('\n', ' '.repeat(14), 'init-preact-app'.rainbow.bold.italic, '\n')

program
  .version(require('./package.json').version)
  .option('-f, --force', 'Delete target directory if it exists')
  .option('-v, --verbose', 'Increase the verbousity')
  .option('--offline', 'Force run in offline mode')
  .arguments('<target>')
  .action(function (target) {
    cwd = target
  })
  .parse(process.argv)

if (typeof cwd === 'undefined') {
  console.error(' ', 'No target directory given!'.err)
  program.outputHelp()
  process.exit(1)
} else {
  const opts = Object.assign({}, program.opts())
  console.log('Started with target:'.cyan, `${cwd}`.hi)
  choosePackageManager()
    .then(pm => {
      Object.assign(opts, { pm })
      console.log('Using package manager:'.cyan, pm.hi.bold, '\n')
    })
    .then(() => {
      if (!opts.offline) return checkIfOffline()
      console.log('--offline'.yellow, 'flag passed'.cyan)
      return true
    })
    .then(offline => {
      Object.assign(opts, { offline })
      if (offline) {
        console.log('You appear to be'.red, 'offline'.bold.red)
        console.log(
          'Using'.green,
          'cached'.cyan.bold,
          'version of the template'.green,
          '\n'
        )
      }
      initApp(cwd, opts)
    })
}
