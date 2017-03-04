var marked = require("marked");
import Renderer from "./renderer";
import * as fs from "fs";

function addChildKeys(source: any, dest: any): void {
	for (let key in source) {
		dest[key] = {};

		if (source[key].children) {
			addChildKeys(source[key].children, dest[key]);
		}
	}
}

function writeFilePromise(fileName: string, content: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		fs.writeFile(fileName, content, (error: Error) => {
			if (error) {
				reject(error);
			}

			resolve();
		});
	});
}

function convertJson(input: string, outputFile: string, keysFile?: string, yamlFile?: string): Promise<void> {
	const render = new Renderer();

	marked.setOptions({
		renderer: render
	});

	marked(input);

	const promises: Array<Promise<void>> = [ writeFilePromise(outputFile, render.getOutput()) ];

	if (keysFile) {
		let treeKeys: any = {};

		addChildKeys(render.getFullObject().children, treeKeys);

		let jsonStr = JSON.stringify(treeKeys, null, 4);

		promises.push(writeFilePromise(keysFile, jsonStr));
	}

	if (yamlFile) {
		promises.push(writeFilePromise(yamlFile, render.getYamlOutput()));
	}

	return Promise.all(promises).then(() => undefined);
}

const files = [
	"legal",
	"races",
	"classes",
	"beyond1st",
	"equipment",
	"feats",
	"mechanics",
	"combat",
	"spellcasting",
	"running",
	"magic items",
	"monsters",
	"conditions",
	"gods",
	"planes",
	"creatures",
	"npcs"
];

const promises: Array<Promise<string>> = [];

for (let i = 0; i < files.length; i++) {
	const fileName: string = (i < 10 ? "0" + i : i) + " " + files[i];

	promises.push(new Promise((resolve, reject) => {
		fs.readFile("markdown/" + fileName + ".md", { encoding: "utf-8" }, (error: Error, fileContent: string) => {
			if (error) {
				return reject(error);
			}

			convertJson(fileContent, "json/" + fileName + ".json", null, "yaml/" + fileName + ".yaml");

			resolve(fileContent);
		});
	}));
}

Promise.all(promises).then((fileContents: Array<string>) => {
	const fullSRD = fileContents.join("\n\n");

	convertJson(fullSRD, "5esrd.json", "5esrdkeys.json", "5esrd.yaml");

	return writeFilePromise("5esrd.md", fullSRD);
});