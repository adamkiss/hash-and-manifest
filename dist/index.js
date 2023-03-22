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
const copyFile = util_1.default.promisify(fs_1.default.copyFile);
const readDir = util_1.default.promisify(fs_1.default.readdir);
const mkdir = util_1.default.promisify(fs_1.default.mkdir);
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
        return await writeFile(config.manifest?.path, config.template({}));
    }
    // Get list of files, their hashes and rename them
    const files = await readDir(config.directory);
    const manifest = {};
    await Promise.all(files.map(async (fileName) => {
        const file = path_1.default.parse(fileName);
        const hash = await hasha_1.default.fromFile(path_1.default.join(config.directory, fileName), { algorithm: 'md5' });
        let srcFilePath = path_1.default.join(config.directory, file.base);
        let dstFilePath = path_1.default.join(config.directory, manifest[file.base]);
        if (config.output) {
            const dstDir = path_1.default.join(config.output, config.directory);
            const dstFilePath = path_1.default.join(dstDir, manifest[file.base]);
            await mkdir(dstDir, { recursive: true });
            await copyFile(srcFilePath, dstFilePath);
        }
        else {
            await renameFile(srcFilePath, dstFilePath);
        }
        if (config.manifest?.fullPath) {
            manifest[srcFilePath] = dstFilePath;
        }
        else {
            manifest[file.base] = [file.name, '.', hash, file.ext].join('');
        }
    }));
    // Generate the manifest
    await writeFile(config.manifest?.path, config.manifest?.template(manifest));
})();
