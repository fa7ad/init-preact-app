#!/usr/bin/env node

const { cyan, red } = require('chalk')
const program = require('commander')

const logErr = (...args) => console.error(red(...args))
const logBlu = (...args) => console.log(cyan(...args))
const space = (num) => ' '.repeat(num)

let cwd

program
  .version(require('./package.json').version)
  .arguments('<target>')
  .action(function (target) {
    cwd = target
  })
  .parse(process.argv)

if (typeof cwd === 'undefined') {
  logErr(space(1), 'No target directory given!')
  program.help()
  process.exit(1)
}

