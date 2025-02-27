#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { parseCtrfFile } from './ctrf-parser';
import { formatResultsMessage, formatFailedTestsMessage, formatFlakyTestsMessage } from './message-formatter';
import { sendMattermostMessage } from './mattermost-notify';

const argv = yargs(hideBin(process.argv))
  .command(
    'results <path>',
    'Send test results summary to MatterMost',
    (yargs) => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .option('onFailOnly', {
          alias: 'f',
          type: 'boolean',
          description: 'Send message only if there are failed tests',
          default: false,
        });
    },
    async (argv) => {
      try {
        const ctrfData = parseCtrfFile(argv.path as string);
        if (argv.onFailOnly && ctrfData.results.summary.failed === 0) {
          console.log('No failed tests. Message not sent.');
          return;
        }
        const message = formatResultsMessage(ctrfData);
        await sendMattermostMessage(message);
        console.log('Results message sent to MatterMost.');
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    }
  )
  .command(
    'fail-details <path>',
    'Send failed test results to MatterMost',
    (yargs) => {
      return yargs.positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
      });
    },
    async (argv) => {
      try {
        const ctrfData = parseCtrfFile(argv.path as string);
        const message = formatFailedTestsMessage(ctrfData);
        // await sendMatterMostMessage(message);
        console.log('Coming soon!');
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    }
  )
  .command(
    'flaky <path>',
    'Send flaky test results to MatterMost',
    (yargs) => {
      return yargs.positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
      });
    },
    async (argv) => {
      try {
        const ctrfData = parseCtrfFile(argv.path as string);
        const message = formatFlakyTestsMessage(ctrfData);
        if (message) {
          await sendMattermostMessage(message); 
          console.log('Flaky tests message sent to MatterMost.');
        } else {
          console.log('No flaky tests detected. No message sent.');
        }
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    }
  )
  .help()
  .argv;