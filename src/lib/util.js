import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { createCodeFrame } from 'simple-code-frame';

export function moduleDir(name) {
	let file = require.resolve(name),
		find = `${path.sep}node_modules${path.sep}${name}`,
		index = file.indexOf(find);
	return file.substring(0, index + find.length);
}

export function fileExists(file) {
	try {
		return fs.statSync(file).isFile();
	} catch (e) {}
	return false;
}

export function readFile(file) {
	try {
		return fs.readFileSync(file, 'utf8');
	} catch (e) {}
}

export function readDir(file) {
	try {
		return fs.readdirSync(file);
	} catch (e) {}
}

export function tryRequire(file) {
	if (fileExists(file)) return require(file);
}

export function dedupe(value, index, arr) {
	return arr.indexOf(value) === index;
}

let firstFile;
export function cleanStack(str, cwd = process.cwd()) {
	str = str.replace(/^[\s\S]+\n\n([A-Za-z]*Error: )/g, '$1');

	firstFile = null;

	let clean = str.replace(
		new RegExp(
			`( |\\()(https?:\\/\\/localhost:\\d+\\/base\\/|${cwd.replace(
				/([\\/[\]()*+$!^.,?])/g,
				'\\$1'
			)}\\/*)?([^\\s():?]*?)(?:\\?[a-zA-Z0-9]+?)?(:\\d+(?::\\d+)?)`,
			'g'
		),
		replacer
	);
	if (firstFile != null) {
		let [filename, line, char] = firstFile;
		if (line) {
			let read;
			try {
				read = fs.readFileSync(path.resolve(cwd, filename), 'utf8');
			} catch (e) {}
			if (read) {
				let codeFrame = createCodeFrame(read, line, char, {
					before: 3,
					after: 3,
				})
					.split('\n')
					.map((line) => {
						if (/^>\s(.*)/.test(line)) {
							return line.replace(/^>(.*)/, (_, content) => {
								return chalk.redBright('>') + chalk.white(content);
							});
						} else if (/^\s+\|\s+\^/.test(line)) {
							return line
								.replace('|', chalk.dim('|'))
								.replace('^', chalk.redBright('^'));
						}
						return chalk.dim(line);
					})
					.join('\n');

				clean += codeFrame;
			}
		}
	}
	return chalk.red(clean);
}

function replacer(str, before, root, filename, position) {
	if (firstFile == null) {
		let [line, char] = position.match(/\d+/g) || [];
		firstFile = [filename, line - 1, char | 0];
	}
	return before + chalk.blue('./' + filename + chalk.dim(position));
}
