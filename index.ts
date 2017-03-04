var marked = require("marked");
import Renderer from "./renderer";
import * as fs from "fs";

function addChildKeys(source, dest) {
	for (let key in source) {
		dest[key] = {};
		if (source[key].children) {
			addChildKeys(source[key].children, dest[key]);
		}
	}
}

function convertJson(inputFile: string, outputFile: string, keysFile?: string): void {
	const render = new Renderer();

	marked.setOptions({
		renderer: render
	});

	const srd = fs.readFileSync(inputFile, { encoding: "utf-8" });

	marked(srd);

	fs.writeFileSync(outputFile, render.getOutput());

	if (keysFile) {
		let treeKeys: any = {};

		addChildKeys(render.getFullObject().children, treeKeys);

		let jsonStr = JSON.stringify(treeKeys, null, 4);
		fs.writeFileSync(keysFile, jsonStr);
	}
}

convertJson("5esrd.md", "5esrd.json", "5esrdkeys.json");

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

for (let i = 0; i < files.length; i++) {
	const fileName: string = (i < 10 ? "0" + i : i) + " " + files[i];

	convertJson("markdown/" + fileName + ".md", "json/" + fileName + ".json");
}