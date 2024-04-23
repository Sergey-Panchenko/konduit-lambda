'use strict';

const expect = require('expect');

const { encryptText, decryptText } = require('../../src/utils/encryption');

describe('encryption util', () => {
  it('should work with default setup', () => {
    const word = 'HelloWorld';
    const secret = '123123abc';

    const cyphertext = encryptText(word, secret);
    expect(cyphertext).toNotEqual(word);

    const decryptedWord = decryptText(cyphertext, secret);
    expect(decryptedWord).toEqual(word);
  });

  it.skip('should work with custom algorithm', () => {
    const word = 'HelloWorld';
    const secret = '123123abc';
    const algo = 'rc4';

    const cyphertext = encryptText(word, secret, algo);
    expect(cyphertext).toNotEqual(word);

    const decryptedWord = decryptText(cyphertext, secret, algo);
    expect(decryptedWord).toEqual(word);
  });

  it('should NOT work with different secret keys', () => {
    const word = 'HelloWorld';
    const secretE = '123123abc';
    const secretD = 'abc123123';

    const cyphertext = encryptText(word, secretE);
    expect(cyphertext).toNotEqual(word);

    const decryptedWord = decryptText(cyphertext, secretD);
    expect(decryptedWord).toNotEqual(word);
  });
});
