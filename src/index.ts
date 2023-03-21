#!/usr/bin/env node

import path from 'path'
import fs from 'fs'
import util from 'util'
import hasha from 'hasha'

const writeFile = util.promisify(fs.writeFile)
const renameFile = util.promisify(fs.rename)
const renameFileOrOK = (oldFile: string, newFile: string) => renameFile(oldFile, newFile).catch(err => console.error(err))
const readDir = util.promisify(fs.readdir)

/*
@note This is for now. I usually run assets from project root
			If it later bites me in the ass, I'll have this prepared
*/
const findProjectRoot = () => process.cwd()

;(async () => {
	const config = require(findProjectRoot() + "/ham.config.js")

	console.log('Renaming files to their hashes & generating a manifest…')

	// Return empty manifest if called as `hash-and-manifest empty`
	if (process.argv.length === 3 && process.argv[2]) {
		return await writeFile(config.manifest, config.template({}))
	}

	// Get list of files, their hashes and rename them
	const files = await readDir(config.directory)
	const manifest: { [originalName: string]: string } = {}
	await Promise.all(files.map(async fileName => {
		const file = path.parse(fileName)
		const hash = await hasha.fromFile(path.join(config.directory, fileName), {algorithm: 'md5'})

		manifest[file.base] = [file.name, '.', hash, file.ext].join('')

		await renameFileOrOK(
			path.join(config.directory, file.base),
			path.join(config.directory, manifest[file.base])
		)
	}))

	// Generate the manifest
	await writeFile(config.manifest, config.template(manifest))
})()
