# Hash and Manifest

Simple tool to take a directory of files, calculate their md5 hashes, rename them to `[name].[hash].[ext]` and generate a manifest at given path, whose contents are generated via templating function.

---

## Install and use

### Install

``` bash
npm i -S hash-and-manifest
```

### NPM scripts usage

``` json
{
	"scripts": {
		"manifest": "hash-and-manifest",
		"manifest:empty": "hash-and-manifest empty"
	}
}
```

### Usage: detailed

Create the `ham.config.js` file in the root of your project, like so:

``` js
module.exports = {
	directory: 'path/to/assets',
	output: 'destination/path',
	manifest: {
		name: 'path/to/manifest.json',
		fullPath: true,
		template: (files) => JSON.stringify(files),
	}
}
```

- `directory`: string, describes a path to your assets directory relative to current working directory
- `output`: string, describes a path to your destination directory relative to current working directory. If no output dir is provided then all original files will be renamed
- `manifest.name`: string, relative path with filename and desired extension. What you do with the manifest further is on you
- `manifest.fullPath`: boolean, whether to include the full relative path to each asset on the manifest file or just the file names
- `manifest.template`: function, which generates the content of manifest for you. It is given one argument: `files` object
	- `files` object: object in the format `{original_name: hashed_name}`

Add a `hash-and-manifest` call in your `package.json` in the desired step of your build chain.

### Generate empty manifest

HAM also has a single argumented call to be used in npm scripts - `hash-and-manifest empty`, which generates _empty_ manifest. This is to be used at the beginning of watch/build loops, so you can expect existing manifest at the desired place at all times.

## Example configurations

These are the configuration I use for my specific usecases: in `production` environment, assets get built into "dist" folder, fingerprinted and deployed. In development, they are watched and continuously built into dev folder and _not_ fingerprinted because cache is turned off locally. Both `dev` and `dist` folders are ignored in the repositories.

Note: I generate a function to be called in the end system which includes the list of files. Generating empty manifest and returning "development" version of the URL is how I deal with watch/build loop locally.

### [Eleventy](https://www.11ty.dev)

``` js
module.exports = {
	directory: 'site/assets/dist',
	manifest: {
		name: 'data/assets.js',
		fullPath: false,
		template: files => (`module.exports = _ => file => {
			const list = ['${Object.keys(files).join(`','`)}']
			const files = {
				${Object.keys(files).map(k => `'${k}': '${files[k]}'`).join(`,
				`)}
			}

			return Object.keys(files).includes(file) ? ${'`dist/${files[file]}`'} : ${'`dev/${file}`'}
		}`),
	},
}
```

### [Kirby CMS](https://getkirby.com)

``` js
module.exports = {
	directory: 'source-folder',
	manifest:{
		name: 'site/snippets/_bundler.php',
		fullPath: true,
		template: files => (`<?php
			if (! function_exists('bundle')) {
				function bundle($key = '') {
					$manifest = [
						${Object.keys(files).map(k => `'${k}' => '${files[k]}'`).join(`,
						`)}
					];
					return array_key_exists($key, $manifest) ? "dist/" . $manifest[$key] : "dev/" . $key;
				}
			}
		`),
	},
}
```

## license

ISC, since it's the NPM default.
Adam Kiss 2021
