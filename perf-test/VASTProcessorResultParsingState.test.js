'use strict';

const xmlDocRaw = require('fs').readFileSync(`${__dirname}/fixture/vast-adpod-with-wrapper-in-1st-ad.xml`, 'utf8');

const AbstractState = require('../src/state-machine/AbstractState');
const VASTProcessorResultParsingState = require('../src/state-machine/VASTProcessorResultParsingState');

const MockLogger = require('../test/helpers/mockLogger');
AbstractState.LOGGER = new MockLogger({ silent: true });

const Benchmark = require('benchmark');
const bench = new Benchmark('VASTProcessorResultParsingState', {
  onStart: () => {
    console.log('Running..');
  },
  defer: true,
  fn: (deferred) => {
    const context = {
      currentVastUrl: 'http://example.com',
      currentTextResult: xmlDocRaw,
      setState: () => {
        deferred.resolve();
      },
      successfulFinish: () => {
        console.log('successfulFinish')
      },
      finishWithError: () => {
        console.log('finishWithError')
      }
    };

    try {
      const state = new VASTProcessorResultParsingState();

      state.run(context);

    } catch(e) {
      console.log(e)
    }

  }
});

bench.on('complete', () => {
  console.log(String(bench));

  process.exit(0);
})

bench.run({ async: true })
