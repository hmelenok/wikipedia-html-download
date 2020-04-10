"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.searchAndWriteWikis = searchAndWriteWikis;

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _striptags = _interopRequireDefault(require("striptags"));

var _cheerio = _interopRequireDefault(require("cheerio"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fs = _interopRequireDefault(require("fs"));

var _listr = _interopRequireDefault(require("listr"));

var _kebabCase = _interopRequireDefault(require("lodash/kebabCase"));

var _truncate = _interopRequireDefault(require("lodash/truncate"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function searchAndWriteWikis(options) {
  let titles = [];
  const currentPath = process.cwd();
  const tasks = new _listr.default([{
    title: 'Searching for term',
    task: async () => {
      titles = await (0, _nodeFetch.default)(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${options.term}&srlimit=${options.pages}&format=json`).then(r => r.json()).then(response => {
        const searchList = response.query.search;
        const titlesMap = searchList.map(({
          title
        }) => title);
        return titlesMap;
      });
      return titles;
    }
  }]);
  tasks.add({
    title: 'Writing each individual wiki',
    task: async () => {
      const urlsToDownload = titles.map(title => `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&format=json`);
      return await Promise.all(urlsToDownload.map((title, index) => (0, _nodeFetch.default)(title).then(r => r.json()).then(content => {
        return content.parse.text['*'];
      }).then(async r => {
        const fileStream = _fs.default.createWriteStream(`${currentPath}/${(0, _kebabCase.default)(titles[index])}.${options.stripHtml ? 'txt' : 'html'}`);

        return await new Promise((resolve, reject) => {
          let fileContent = r;

          const $ = _cheerio.default.load(r);

          $('style').remove();
          fileContent = $.html();

          if (options.stripHtml === true) {
            fileContent = (0, _striptags.default)(fileContent);
          }

          if (options.charactersLimit !== 0) {
            fileContent = (0, _truncate.default)(fileContent, {
              omission: '',
              length: options.charactersLimit
            });
          }

          fileStream.write(fileContent);
          fileStream.on('error', err => {
            reject(err);
          });
          fileStream.on('finish', function () {
            resolve();
          });
          fileStream.end();
        });
      })));
    }
  });
  await tasks.run();
  console.log(`${'%s Search complete, wiki pages saved to ' + '"'}${currentPath}"`, _chalk.default.green.bold('DONE'));
  return true;
}