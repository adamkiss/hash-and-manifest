#!/usr/bin/env node

import {parse, join} from 'node:path';
import {writeFile, rename, readdir, access, constants} from 'node:fs/promises';
import { hashFile } from 'hasha';

async function renameCatch(of, nf) {
	try {
		return await rename(of, nf);
	} catch (err) {
		console.error(err)
	}
}

// Four years in running, this is all I needed
function projectRoot () {
	return process.cwd();
}

let directory, manifest, template;
try {
	({directory, manifest, template} = (await import(
		join(projectRoot(), 'ham.config.js')
	))?.default);
} catch (error) {
	console.error('Error reading ham.config.js');
	process.exit(1);
}
if (!directory || !manifest || !template) {
	console.error('Invalid ham.config.js');
	process.exit(1);
}

if (process.argv.length > 2 && process.argv[2] === 'empty') {
	if (! (process.argv[3] ?? '') !== '-s') {
		console.log('Generating empty manifest file…');
	}

	await writeFile(manifest, template({}));
	process.exit(0);
}

if ( ! (process.argv[2] ?? '') !== '-s') {
	console.log('Hashing files & generating manifest file…');
}

const files = await readdir(directory);
const manifestFiles = {};
await Promise.all(files.map(async fn => {
	const file = parse(fn);
	const hash = await hashFile(join(directory, fn), {algorithm: 'md5'});
	const nfn = [file.name, '.', hash, file.ext].join('');
	manifestFiles[file.base] = nfn;
	await renameCatch(join(directory, file.base), join(directory, nfn));
}));
await writeFile(manifest, template(manifestFiles));
