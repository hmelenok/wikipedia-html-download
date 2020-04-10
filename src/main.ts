import fetch from 'node-fetch';
import striptags from 'striptags';
import cheerio from 'cheerio';
import chalk from 'chalk';
import fs from 'fs';
import Listr from 'listr';
import {CliOptions} from './types';
import kebabCase from 'lodash/kebabCase';
import truncate from 'lodash/truncate';

export async function searchAndWriteWikis(options: CliOptions) {
  let titles = [];
  const currentPath = process.cwd();
  const tasks = new Listr([
    {
      title: 'Searching for term',
      task: async (): Promise<string[]> => {
        titles = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${options.term}&srlimit=${options.pages}&format=json`
        )
          .then(r => r.json())
          .then(response => {
            const searchList = response.query.search;
            const titlesMap = searchList.map(({title}) => title);

            return titlesMap;
          });

        return titles;
      }
    }
  ]);

  tasks.add({
    title: 'Writing each individual wiki',
    task: async (): Promise<any[]> => {
      const urlsToDownload = titles.map(
        title =>
          `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
            title
          )}&format=json`
      );

      return await Promise.all(
        urlsToDownload.map((title, index) =>
          fetch(title)
            .then(r => r.json())
            .then(content => {
              return content.parse.text['*'];
            })
            .then(async r => {
              const fileStream = fs.createWriteStream(
                `${currentPath}/${kebabCase(titles[index])}.${options.stripHtml ? 'txt' : 'html'}`
              );

              return await new Promise((resolve, reject) => {
                let fileContent = r;

                const $ = cheerio.load(r);
                $('style').remove();
                fileContent = $.html();

                if (options.stripHtml === true) {
                  fileContent = striptags(fileContent);
                }

                if (options.charactersLimit !== 0) {
                  fileContent = truncate(fileContent, {
                    omission: '',
                    length: options.charactersLimit
                  });
                }

                fileStream.write(fileContent);
                fileStream.on('error', err => {
                  reject(err);
                });
                fileStream.on('finish', function() {
                  resolve();
                });
                fileStream.end();
              });
            })
        )
      );
    }
  });

  await tasks.run();
  console.log(
    `${'%s Search complete, wiki pages saved to ' + '"'}${currentPath}"`,
    chalk.green.bold('DONE')
  );

  return true;
}
