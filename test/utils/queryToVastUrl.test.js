'use strict';

const expect = require('expect');
const url = require('url');
const queryToVastUrl = require('../../src/utils/queryToVastUrl');

describe('queryToVastUrl util', () => {
  const invalidUrl = 'http://konduit.me/api/vastProxy?a=valueA&b=valueB&url=_';
  const validUrl = 'http://konduit.me/api/vastProxy?a=valueA&b=valueB&url=http://domain.com';


  it('should build invalid url with respect all parameters passed to proxy endpoint', () => {
    const urlObject = url.parse(invalidUrl, true);

    expect(queryToVastUrl(urlObject.query))
      .toEqual('_?a=valueA&b=valueB');
  });

  it('should build valid url with respect all parameters passed to proxy endpoint', () => {
    const urlObject = url.parse(validUrl, true);

    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://domain.com/?a=valueA&b=valueB');
  });

  it('should build url with respect all parameters and concatenate by `?`', () => {
    const urlObject = url.parse('http://konduit.me/api/vastProxy?a=valueA&b=valueB&url=http://domain.com', true);

    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://domain.com/?a=valueA&b=valueB');
  });

  it('should build url with respect all parameters and concatenate by `&`', () => {
    const urlObject = url.parse('http://konduit.me/api/vastProxy?a=valueA&b=valueB&url=http://domain.com?c=C', true);

    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://domain.com/?c=C&a=valueA&b=valueB');
  });

  it('should build url with respect all parameters and concatenate by `&` #1', () => {
    const urlObject = url.parse(
      'http://konduit.me/api/vastProxy?url=https://support-static.jwplayer.com/content/advertising/vpaid-2-test.xml',
      true
    );

    expect(queryToVastUrl(urlObject.query))
      .toEqual(
        'https://support-static.jwplayer.com/content/advertising/vpaid-2-test.xml'
      );
  });

  it('should build url with respect all parameters and concatenate by `&` #2', () => {
    const urlObject = url.parse(
      'http://konduit.me/api/vastProxy?p2=222&url=https://support-static.jwplayer.com/content/advertising/vpaid-2-test.xml?p1=111',
      true
    );

    expect(
      queryToVastUrl(urlObject.query))
      .toEqual(
        'https://support-static.jwplayer.com/content/advertising/vpaid-2-test.xml?p1=111&p2=222'
      );
  });

  it('should build valid url with respect to no-value query flags', () => {
    const urlObject = url.parse('http://konduit.me/api/vastProxy?a=valueA&b=valueB&flag=&url=http://domain.com', true);

    expect(
      queryToVastUrl(urlObject.query))
      .toEqual(
        'http://domain.com/?a=valueA&b=valueB&flag'
      );
  });

  it('should build url without params', () => {
    const urlObject = url.parse(
      'http://konduit.me/api/vastProxy?url=https://support-static.jwplayer.com/content/advertising/vpaid-2-test.xml',
      true
    );

    expect(queryToVastUrl(urlObject.query))
      .toEqual(
        'https://support-static.jwplayer.com/content/advertising/vpaid-2-test.xml'
      );
  });

  it('should build url with respect all parameters and encode', () => {
    const urlObject = url.parse('http://k.me?url=http://d.com?title=Encode Me', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://d.com/?title=Encode%20Me');
  });

  it('should build url from encoded url passed', () => {
    const urlObject = url.parse('http://k.me?url=http%3A%2F%2Fd.com%3Ftitle%3DEncode%20Me+Now', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://d.com/?title=Encode%20Me%20Now');
  });

  it('should build url from encoded url passed', () => {
    const urlObject = url.parse('http://k.me?url=http%3A%2F%2Fd.com%3Ftitle%3DEncode%20Me+Now', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://d.com/?title=Encode%20Me%20Now');
  });

  it('should build url with konduit parameters', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&konduit_ab_testing=1', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page');
  });

  it('should build url with special symbols in parameters', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&caid=CL:VD553850964&csid=ABConAOL&resp=vast2&prof=168234:aol_as3_live;;slid=Pre&ptgt=a&slau=SF%20PreRoll&tpcl=PREROLL&maxd=60', true);

    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?caid=CL:VD553850964&csid=ABConAOL&resp=vast2&prof=168234:aol_as3_live;;slid=Pre&ptgt=a&slau=SF%20PreRoll&tpcl=PREROLL&maxd=60');
  });

  it('should build url with multiple optional parameters', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&pageUrl=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?cb=%5BCACHE_BUSTER%5D&pageUrl=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D');
  });

  // TODO: Need to add support for this case
  // it('should build url with pageUrl parameter with hash', () => {
  //   const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&pageUrl=http://ex.net/page#link&flag=1', true);
  //   expect(queryToVastUrl(urlObject.query))
  //     .toEqual('http://example.com/page?cb=%5BCACHE_BUSTER%5D&pageUrl=http%3A%2F%2Fex.net%2Fpage%23link&flag=1');
  // });

  it('should build url with param convertor', () => {
    // eslint-disable-next-line no-unused-vars,arrow-body-style
    const o2tokenConvertor = (value) => {
      return '12345';
    };

    const paramConverters = {
      o2token: o2tokenConvertor,
    };

    const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&pageUrl=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D', true);
    expect(queryToVastUrl(urlObject.query, paramConverters))
      .toEqual('http://example.com/page?cb=%5BCACHE_BUSTER%5D&pageUrl=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=12345');
  });

  it('should build url with konduit_url parameter', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&konduit_url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&pageUrl=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?cb=%5BCACHE_BUSTER%5D&pageUrl=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D');
  });

  it('should build url with konduit_url and url parameters', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&konduit_url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?cb=%5BCACHE_BUSTER%5D&url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D');
  });

  it('should build url with 2 url parameters', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&cb=%5BCACHE_BUSTER%5D&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D');
  });

  it('should build url with konduit_url and 2 url parameters', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&konduit_url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D&url=http://domain.com', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?cb=%5BCACHE_BUSTER%5D&url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&url=http%3A%2F%2Fdomain.com&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D');
  });

  it('should build url with 2 url parameters and custom[0]', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D&custom[0]=1', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&cb=%5BCACHE_BUSTER%5D&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D&custom[0]=1');
  });

  it('should build url with 2 url parameters and url[0]', () => {
    const urlObject = url.parse('http://k.me?konduit_id=1234567890&url=http://example.com/page&cb=%5BCACHE_BUSTER%5D&url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li\'s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D&url[0]=http://ander.com', true);
    expect(queryToVastUrl(urlObject.query))
      .toEqual('http://example.com/page?url=http%3A%2F%2Ftrendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2FVideo-of-the-Day&cb=%5BCACHE_BUSTER%5D&a.ua=%5BUSER_AGENT%5D&duration=%5BVIDEO_DURATION%5D&title=How%20to%20Make%20Chef%20Shun%20Li%27s%20Almond%20Squares&pi.flashonpage=0&o2token=AABZ7AAAZ0P2wsf83aqdEO6IE1tJp6JZxXTXTw%253D%253D&url[0]=http%3A%2F%2Fander.com');
  });
});
