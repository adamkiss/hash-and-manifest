#!/usr/bin/env node

import path from 'path'
import fs from 'fs'
import util from 'util'
import hasha from 'hasha'

const writeFile = util.promisify(fs.writeFile)
const renameFile = util.promisify(fs.rename)
const copyFile = util.promisify(fs.copyFile)
const readDir = util.promisify(fs.readdir)
const mkdir = util.promisify(fs.mkdir)

const manifest: { [originalName: string]: string } = {}

async function processDirectory(dirPath: string, config: any) {
	const elements = await readDir(dirPath)
	await Promise.all(elements.map(async elementPath => {
		if (fs.lstatSync(elementPath).isDirectory()) {
			return await processDirectory(elementPath, config)
		}
		const file = path.parse(elementPath)
		const hash = await hasha.fromFile(path.join(config.directory, elementPath), { algorithm: 'md5' })
		const newFileName = `${file.name}-${hash}${file.ext}`
	
		let srcFilePath = path.join(config.directory, file.base)
		let dstFilePath = path.join(config.directory, newFileName)

		if (config.output) {
			const dstDir = path.join(config.output, config.directory)
			dstFilePath = path.join(dstDir, newFileName)
			await mkdir(dstDir, { recursive: true })
			await copyFile(srcFilePath, dstFilePath)
		} else {
			await renameFile(srcFilePath, dstFilePath)
		}

		if (config.manifest?.fullPath) {
			manifest[srcFilePath] = dstFilePath
		} else {
			manifest[file.base] = newFileName
		}
	}))
}

/*
@note This is for now. I usually run assets from project root
			If it later bites me in the ass, I'll have this prepared
*/
const findProjectRoot = () => process.cwd()

;(async () => {
	const config = require(`${findProjectRoot()}/ham.config.js`)

	console.log('Renaming files to their hashes & generating a manifest…')

	// Return empty manifest if called as `hash-and-manifest empty`
	if (process.argv.length === 3 && process.argv[2]) {
		return await writeFile(config.manifest?.path, config.template({}))
	}

	// Get list of files, their hashes and rename them
	await processDirectory(config.directory, config)

	// Generate the manifest
	await writeFile(config.manifest?.path, config.manifest?.template(manifest))
})()
