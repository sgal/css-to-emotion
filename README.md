# CSS to EmotionJs converter

This tool is converting CSS files to JS files compatible with EmotionJS. Initial implementation is taken from [css-in-js-generator](https://github.com/brikou/CSS-in-JS-generator), converted to JS and improved to fit the needs of internal project.

To convert a file run following command:
```bash
node ./index.js <path/to/css/file>
```
For example
```
node ./index.js ../atgse/packages/atgse/src/payment/Deposit.css
```
The result of the conversion will be placed in the same folder as the source file with extension `.styles.js`.
