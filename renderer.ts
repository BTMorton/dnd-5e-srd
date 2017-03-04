import * as YAML from "yamljs";

export default class Renderer {
	private lastLevel: number = 0;
	private firstHeader: boolean = true;
	private jsonObj: any = {};
	private levels: Array<any> = [];
	private curObj: any;

	public code(code, lang, escaped) {
		const ret =  '`' + code.replace(/\n/g, " ") + '`"';
		this.getObject().content.push(ret);
		return ret;
	}

	public blockquote(quote) {
		return quote;
	}

	public html(html) {
		this.getObject().content.push(html);
		return html;
	}

	public heading(text, level, raw) {
		if (level < this.lastLevel) {
			let lastRule: any = this.levels.pop();

			while (lastRule != undefined && level < lastRule.level) {
				lastRule = this.levels.pop();
			}

			if (lastRule != undefined && lastRule.level < level) {
				this.levels.push(lastRule);
			}
		} else if (level == this.lastLevel) {
			this.levels.pop();
		}

		const obj = this.getObject();

		if (!obj.children) {
			obj.children = {}
		}

		obj.children[text] = { level: level, content: [] };

		this.levels.push({ name: text, level: level });

		this.lastLevel = level;
	}

	public hr() {
		this.getObject().content.push('---------------------------------------------------------');
		return '---------------------------------------------------------';
	}

	public list(body, ordered) {
		const listBody: Array<string> = JSON.parse('[' + body.slice(0, -1) + "]");
		this.getObject().content = this.getObject().content.filter((s: string) => !listBody.includes(s));
		this.getObject().content.push(listBody);
		return '[' + body.slice(0, -1) + "]";
	}

	public listitem(text) {
		return text.startsWith(',"') ? text.slice(1) + "," : '"' + text + '",';
	}

	public paragraph(text) {
		this.getObject().content.push(text);
		return text;
	}

	public table(header, body) {
		const headerArray = JSON.parse(header.slice(0, -1));
		const bodyArray = JSON.parse("[" + body.slice(0, -1) + "]");

		const table = {};

		for (let j = 0; j < headerArray.length; j++) {
			table[headerArray[j]] = [];

			for (let i = 0; i < bodyArray.length; i++) {
				table[headerArray[j]].push(bodyArray[i][j]);
			}
		}

		this.getObject().content.push({ "table": table });

		return JSON.stringify(table);
	}

	public tablerow(content) {
		return "[" + content.slice(0, -1) + "],";
	}

	public tablecell(content, flags) {
		return '"' + content + '",';
	}

	// span level renderer
	public strong(text) {
		return '**' + text + '**';
	}

	public em(text) {
		return '*' + text + '*';
	}

	public codespan(text) {
		return '```' + text + '```';
	}

	public br() {
		this.getObject().content.push("");
		return '';
	}

	public del(text) {
		return '~~' + text + '~~';
	}

	public link(href, title, text) {
		return text + '(' + href + ')';
	}

	public image(href, title, text) {
		return text + '(' + href + ')';
	}

	public text(text) {
		return text.replace(/\n/g, " ");
	}

	private getObject(): any {
		let obj: any = this.jsonObj;

		for (let level of this.levels) {
			obj = obj.children[level.name];
		}

		return obj;
	}

	private addChildrenToObject(parent: any, target: any) {
		for (let childKey in parent.children) {
			const child: any = parent.children[childKey]

			target[childKey] = {};

			if (child.content.length == 1) {
				if (!child.hasOwnProperty("children")) {
					target[childKey] = child.content[0];
				} else {
					target[childKey].content = child.content[0];
				}
			} else if (child.content.length > 0) {
				target[childKey].content = child.content;
			}

			if (child.hasOwnProperty("children")) {
				this.addChildrenToObject(child, target[childKey]);
			}
		}
	}

	public getOutput() {
		const output: any = {};

		this.addChildrenToObject(this.jsonObj, output);

		return JSON.stringify(output, null, 4);
	}

	public getYamlOutput() {
		const output: any = {};

		this.addChildrenToObject(this.jsonObj, output);

		return YAML.stringify(output, null, 4);
	}

	public getFullObject() {
		return this.jsonObj;
	}
}