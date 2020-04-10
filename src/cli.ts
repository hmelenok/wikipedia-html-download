import arg from 'arg';
import inquirer from 'inquirer';
import {searchAndWriteWikis} from './main';
import {CliOptions} from './types';

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--term': String,
      '--strip-html': Boolean,
      '--pages': Number,
      '--chars': Number,
      '-t': '--term',
      '-s': '--strip-html',
      '-c': '--pages',
      '-l': '--chars'
    },
    {
      argv: rawArgs.slice(2)
    }
  );

  return {
    term: args['--term'] || '',
    stripHtml: args['--strip-html'],
    pages: args['--pages'] || 10,
    charactersLimit: args['--chars'] || 1000
  } as CliOptions;
}

async function promptForMissingOptions(options: CliOptions) {
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

  const answers = await inquirer.prompt(questions);

  return {
    ...options,
    term: answers.term,
    pages: answers.pages,
    stripHtml: answers.stripHtml,
    charactersLimit: answers.charactersLimit
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await searchAndWriteWikis(options);
}
