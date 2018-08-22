"use strict";
const fs = require("fs");
const prettier = require("prettier");
const path = require('path');
const meow = require('meow');
const convertCssForEmotion = require("./lib/convertCssForEmotion");

const cli = meow(`
  Usage
    $ css-to-js <css-file>

  Options

    -o --output   File to save to, otherwise outputs to stdout
`, {
  alias: {
    o: 'output'
  }
})

const [file] = cli.input
const {output} = cli.flags
const filename = path.join(process.cwd(), file)
console.log(`Converting ${filename}`);
const css = fs.readFileSync(filename, 'utf8')
const mod = convertCssForEmotion(css);
const finalCss = prettier.format(mod.replace(/^injectGlobal/m, "css"), {
    tabWidth: 4,
    bracketSpacing: false
}).replace(/^css/m, "injectGlobal");

if (output) {
  const outFile = path.join(process.cwd(), output)
  fs.writeFileSync(outFile, finalCss)
} else {
  const outPath = file.replace(".css", ".styles.js");
  const outFile = path.join(process.cwd(), outPath)
  fs.writeFileSync(outFile, finalCss)
}
