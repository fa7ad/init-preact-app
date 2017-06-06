#!/usr/bin/env node

const program = require('commander')
const { cyan, red } = require('chalk')

let cwd
const space = (num) => ' '.repeat(num)
const logBlu = (...args) => console.log(cyan(...args))
const logErr = (...args) => console.error(red(...args))

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
}

