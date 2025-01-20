# Hash and Manifest

Simple tool to take a directory of files, calculate their md5 hashes, rename them to `[name].[hash].[ext]` and generate a manifest at given path, whose contents are generated via templating function.

---

## Install and use

### Install

``` bash
pnpm i -S hash-and-manifest
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

Create a `ham.config.js` file in the root of your project, like so:

``` js
export default {
	directory: 'path/to/assets',
	manifest: 'path/to/manifest.ext', 
	template: (files) => { return string }
}
```

- `directory`: string, describes a path to your assets directory relative to current working directory
- `manifest`: string, relative path with filename and desired extension. What you do with the manifest further is on you
- `template`: function, which generates the content of manifest for you. It is given one argument: `files` object
	- `files` object: object in the format `{original_name: hashed_name}`

Add a `hash-and-manifest` call in your `package.json` in the desired step of your build chain.

### Generate empty manifest

HAM also has a single argumented call to be used in npm scripts - `hash-and-manifest empty`, which generates _empty_ manifest. This is to be used at the beginning of watch/build loops, so you can expect existing manifest at the desired place at all times.

### Silence the little "generating…" notification

Both `hash-and-manifest` and `hash-and-manifest empty` can be silenced like so:
- `hash-and-manifest -s`
- `hash-and-manifest empty -s`

## Example configurations

These are the configuration I use for my specific usecases: in `production` environment, assets get built into "dist" folder, fingerprinted and deployed. In development, they are watched and continuously built into dev folder and _not_ fingerprinted because cache is turned off locally. Both `dev` and `dist` folders are ignored in the repositories.

Note: I generate a function to be called in the end system which includes the list of files. Generating empty manifest and returning "development" version of the URL is how I deal with watch/build loop locally.

### [Eleventy](https://www.11ty.dev)

``` js
export default {
	directory: 'site/assets/dist',
	manifest: 'data/assets.js',
	template: files => (`module.exports = _ => file => {
	const list = ['${Object.keys(files).join(`','`)}']
	const files = {
		${Object.keys(files).map(k => `'${k}': '${files[k]}'`).join(`,
		`)}
	}

	return Object.keys(files).includes(file) ? ${'`dist/${files[file]}`'} : ${'`dev/${file}`'}
}`)
}
```

### [Kirby CMS](https://getkirby.com)

``` js
export default {
	directory: 'source-folder',
	manifest: 'site/snippets/_assets.php',
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
	`)
}
```

## License
ISC, since it's the NPM default.
Adam Kiss 2025
