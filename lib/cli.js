"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cli = cli;

var _arg = _interopRequireDefault(require("arg"));

var _inquirer = _interopRequireDefault(require("inquirer"));

var _main = require("./main");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function parseArgumentsIntoOptions(rawArgs) {
  const args = (0, _arg.default)({
    '--term': String,
    '--strip-html': Boolean,
    '--pages': Number,
    '--chars': Number,
    '-t': '--term',
    '-s': '--strip-html',
    '-c': '--pages',
    '-l': '--chars'
  }, {
    argv: rawArgs.slice(2)
  });
  return {
    term: args['--term'] || '',
    stripHtml: args['--strip-html'],
    pages: args['--pages'] || 10,
    charactersLimit: args['--chars'] || 1000
  };
}

async function promptForMissingOptions(options) {
  const questions = [];

  if (!options.term) {
    questions.push({
      type: 'input',
      name: 'term',
      message: 'Type search term for wikipedia',
      default: options.term
    });
  }

  questions.push({
    type: 'number',
    name: 'pages',
    default: options.pages,
    message: 'How many pages you want to save? (Max. 500)'
  });
  questions.push({
    type: 'number',
    name: 'charactersLimit',
    default: options.charactersLimit,
    message: 'Limit chars of article (default 1000)'
  });
  questions.push({
    type: 'confirm',
    name: 'stripHtml',
    default: options.stripHtml,
    message: 'Strip html from article?'
  });
  const answers = await _inquirer.default.prompt(questions);
  return _objectSpread({}, options, {
    term: answers.term,
    pages: answers.pages,
    stripHtml: answers.stripHtml,
    charactersLimit: answers.charactersLimit
  });
}

async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await (0, _main.searchAndWriteWikis)(options);
}