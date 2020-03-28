const Commander = require('commander');
const { version } = require('./package.json');
const artistCommands = require('./cmds/artists');
const albumCommands = require('./cmds/albums');
const mp3Commands = require('./cmds/mp3s');

const program = new Commander.Command();
program.version(version);
program
  .command('artists')
  .description('Create artist nodes')
  .action(() => {
    artistCommands.createArtistNode();
  });

program
  .command('albums')
  .description('Create album nodes and their relationships')
  .action(() => {
    albumCommands.createAlbumsNode();
  });

program
  .command('mp3s')
  .description('Create mp3 nodes and their relationships')
  .action(() => {
    mp3Commands.createMp3Node();
  });

program.parse(process.argv);
