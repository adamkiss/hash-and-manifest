module.exports = {
	path: 'site/snippets/_bundler.php',
	template: files => (`<?php
		if (! function_exists('bundle')) {
			function bundle($key = '') {
				$manifest = [
					${Object.keys(files).map(k => `'${k}' => (object)[
						'name' => '${files[k].hash.name}',
						'path' => '${files[k].hash.relative}',
						'type' => '${files[k].type}',
						'url' => '${files[k].url}'
					]`).join(`,
					`)}
				];
				return array_key_exists($key, $manifest) ? $manifest[$key] : $key;
			}
		}
	`)
}