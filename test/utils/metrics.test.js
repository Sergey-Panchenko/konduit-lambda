'use strict';

const expect = require('expect');

const metrics = require('../../src/utils/metrics');

describe('Metrics util', () => {
  afterEach(() => {
    expect.restoreSpies();
  });

  describe('#_flattenTags', () => {
    it('should convert object to tags array', () => {
      // eslint-disable-next-line no-underscore-dangle
      const flatTags = metrics._flattenTags({ type: 'vpaid', cache: 'miss', status: 'processed' });

      expect(flatTags).toEqual(['type:vpaid', 'cache:miss', 'status:processed']);
    });

    context('konduitAutoplay', () => {
      it('should not add autoplay tags if context.konduitAutoplay miss', () => {
        const dummyContext = {
          clientId: 'some-client-id',
        };

        // eslint-disable-next-line no-underscore-dangle
        expect(metrics._contextTags(dummyContext)).toEqual(['cid:some-client-id']);
      });

      it('should not add autoplay tag if no map', () => {
        const dummyContext = {
          clientId: 'some-client-id',
          konduitAutoplay: '99',
        };

        // eslint-disable-next-line no-underscore-dangle
        expect(metrics._contextTags(dummyContext)).toEqual(['cid:some-client-id']);
      });

      it('should add ad:ctp tag if 0', () => {
        const dummyContext = {
          clientId: 'some-client-id',
          konduitAutoplay: '0',
        };

        // eslint-disable-next-line no-underscore-dangle
        expect(metrics._contextTags(dummyContext)).toEqual(['cid:some-client-id', 'ad:ctp']);
      });

      it('should add ad:autoplay if 1', () => {
        const dummyContext = {
          clientId: 'some-client-id',
          konduitAutoplay: '1',
        };

        // eslint-disable-next-line no-underscore-dangle
        expect(metrics._contextTags(dummyContext)).toEqual(['cid:some-client-id', 'ad:autoplay']);
      });

      it('should add ad:ctp if 1', () => {
        const dummyContext = {
          clientId: 'some-client-id',
          konduitAutoplay: '0',
        };

        // eslint-disable-next-line no-underscore-dangle
        expect(metrics._contextTags(dummyContext)).toEqual(['cid:some-client-id', 'ad:ctp']);
      });
    });
  });

  describe('#_contextTags', () => {
    it('should get clientId tag from context', () => {
      const dummyContext = {
        clientId: 'some-client-id',
      };

      // eslint-disable-next-line no-underscore-dangle
      expect(metrics._contextTags(dummyContext)).toEqual(['cid:some-client-id']);
    });
  });

  describe('#_combineAllMetricTags', () => {
    it('should combine provided tags with tags from context', () => {
      const dummyContext = {
        clientId: 'some-client-id',
        konduitAutoplay: '1',
      };
      const dummyTags = { type: 'vpaid', cache: 'miss' };

      // eslint-disable-next-line no-underscore-dangle
      expect(metrics._combineAllMetricTags(dummyContext, dummyTags))
        .toEqual(['type:vpaid', 'cache:miss', 'cid:some-client-id', 'ad:autoplay']);
    });
  });

  describe('#vastCreative', () => {
    it('should call agent.increment in proper format', () => {
      const dummyContext = {
        clientId: 'some-client-id',
        currentVastUrl: 'http://example.com',
      };

      const agentIncrement = expect.spyOn(metrics.agent, 'increment');

      metrics.vastCreative(dummyContext, { type: 'vpaid' });

      expect(agentIncrement).toHaveBeenCalled();
      expect(agentIncrement).toHaveBeenCalledWith('kme.vast.creative',
        ['type:vpaid', 'vendor:example.com', 'apos:0', 'cid:some-client-id']);
    });

    it('should rewrite computed tags with specified directly', () => {
      const dummyContext = {
        clientId: 'some-client-id',
        currentVastUrl: 'http://example.com',
      };

      const agentIncrement = expect.spyOn(metrics.agent, 'increment');

      metrics.vastCreative(dummyContext, {
        type: 'vpaid',
        vendor: 'some-vendor-name',
        apos: 2,
      });

      expect(agentIncrement).toHaveBeenCalled();
      expect(agentIncrement).toHaveBeenCalledWith('kme.vast.creative',
        ['type:vpaid', 'vendor:some-vendor-name', 'apos:2', 'cid:some-client-id']);
    });
  });

  describe('#vastRequest', () => {
    it('should call agent.increment in proper format', () => {
      const dummyContext = {
        clientId: 'some-client-id',
      };

      const agentIncrement = expect.spyOn(metrics.agent, 'increment');

      metrics.vastRequest(dummyContext, {
        type: 'vpaid',
        cache: 'miss',
      });

      expect(agentIncrement).toHaveBeenCalled();
      expect(agentIncrement).toHaveBeenCalledWith('kme.vast.request',
        ['type:vpaid', 'cache:miss', 'cid:some-client-id']);
    });
  });

  describe('#vastUniqueRequest', () => {
    it('should call agent.increment in proper format', () => {
      const dummyContext = {
        clientId: 'some-client-id',
      };

      const agentIncrement = expect.spyOn(metrics.agent, 'increment');

      metrics.vastUniqueRequest(dummyContext, {
        type: 'vpaid',
        cache: 'hit',
      });

      expect(agentIncrement).toHaveBeenCalled();
      expect(agentIncrement).toHaveBeenCalledWith('kme.vast.request.unique',
        ['type:vpaid', 'cache:hit', 'cid:some-client-id']);
    });
  });

  describe('#vastRedirectRequest', () => {
    it('should call agent.increment in proper format', () => {
      const dummyContext = {
        clientId: 'some-client-id',
      };

      const agentIncrement = expect.spyOn(metrics.agent, 'increment');

      metrics.vastRedirectRequest(dummyContext, {
        type: 'vpaid',
        cache: 'hit',
      });

      expect(agentIncrement).toHaveBeenCalled();
      expect(agentIncrement).toHaveBeenCalledWith('kme.vast.request.redirect',
        ['type:vpaid', 'cache:hit', 'cid:some-client-id']);
    });
  });

  describe('#vastAbRequest', () => {
    let spy = null;

    beforeEach(() => {
      spy = expect.spyOn(metrics.agent, 'increment');
    });

    afterEach(() => {
      if (spy) spy.restore();
      spy = null;
    });

    it('should call agent.increment', () => {
      metrics.vastAbRequest({}, {});

      expect(spy).toHaveBeenCalled();
    });

    it('should add appropriate tags', () => {
      const context = {
        adPosition: 2,
        clientId: 'some-client-id',
        currentVastUrl: 'http://example.com/currentvast.xml',
      };

      metrics.vastAbRequest(context, { ab: 'konduited' });

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('kme.vast.ab', [
        'ab:konduited',
        'apos:2',
        'vendor:example.com',
        'type:unknown',
        'cid:some-client-id',
      ]);
    });
  });
});
