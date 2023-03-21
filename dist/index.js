#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const hasha_1 = __importDefault(require("hasha"));
const writeFile = util_1.default.promisify(fs_1.default.writeFile);
const renameFile = util_1.default.promisify(fs_1.default.rename);
const renameFileOrOK = (oldFile, newFile) => renameFile(oldFile, newFile).catch(err => console.error(err));
const readDir = util_1.default.promisify(fs_1.default.readdir);
/*
@note This is for now. I usually run assets from project root
            If it later bites me in the ass, I'll have this prepared
*/
const findProjectRoot = () => process.cwd();
(async () => {
    const config = require(findProjectRoot() + "/ham.config.js");
    console.log('Renaming files to their hashes & generating a manifest…');
    // Return empty manifest if called as `hash-and-manifest empty`
    if (process.argv.length === 3 && process.argv[2]) {
        return await writeFile(config.manifest, config.template({}));
    }
    // Get list of files, their hashes and rename them
    const files = await readDir(config.directory);
    const manifest = {};
    await Promise.all(files.map(async (fileName) => {
        const file = path_1.default.parse(fileName);
        const hash = await hasha_1.default.fromFile(path_1.default.join(config.directory, fileName), { algorithm: 'md5' });
        manifest[file.base] = [file.name, '.', hash, file.ext].join('');
        await renameFileOrOK(path_1.default.join(config.directory, file.base), path_1.default.join(config.directory, manifest[file.base]));
    }));
    // Generate the manifest
    await writeFile(config.manifest, config.template(manifest));
})();
