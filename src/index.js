#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const util = require('util')
const hasha = require('hasha')

const writeFile = util.promisify(fs.writeFile)
const deleteFile = util.promisify(fs.unlink)
const renameFile = util.promisify(fs.rename)
const renameFileOrOK = (oldFile, newFile) => renameFile(oldFile, newFile).catch(err => null)
const readDir = util.promisify(fs.readdir)

/*
@note This is for now. I usually run assets from project root
      If it later bites me in the ass, I'll have this prepared
*/
const findProjectRoot = () => process.cwd()

;(async () => {
  
  const config = require(findProjectRoot() + "/ham.config.js")

  console.log('Renaming files to their hashes & generating a manifest…')

  const files = await readDir(config.directory)
  const manifestFiles = {}
  await Promise.all(files.map(async fileName => {
    const file = path.parse(fileName)
    const hash = await hasha.fromFile(path.join(config.directory, fileName), {algorithm: 'md5'})
    manifestFiles[file.base] = [file.name, '.', hash, file.ext].join('')
  }))
})()