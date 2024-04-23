'use strict';

const intersection = (array1, array2) => {
  const result = [];
  const checkingHash = array2.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
  array1.forEach((value) => {
    if (checkingHash[value]) {
      result.push(value);
    }
  });
  return result;
};

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function compileMacrosTester(dictionary, valueProviders, macroName) {
  if (!dictionary[macroName]) {
    return null;
  }
  const rule = dictionary[macroName].map(escapeRegExp).map(s => `(${s})`).join('|');
  return {
    name: macroName,
    provider: valueProviders[macroName],
    rule: new RegExp(rule, 'gi'),
  };
}

class MacrosResolver {

  /**
   * Instance constructor
   * @param  {Object} dictionary     -- map that defines value macros and anchors that should be
   *                                    resolvedwith this macros
   * @param  {Object} valueProviders -- map that defines value-providing functions for macros
   * @return {MacrosResolver}
   */
  constructor(dictionary = {}, valueProviders = {}) {
    const resolvableMacros = intersection(Object.keys(dictionary), Object.keys(valueProviders));
    const compileMacros = compileMacrosTester.bind(null, dictionary, valueProviders);
    this.macros = [];
    resolvableMacros.map(compileMacros).forEach(tester => this.macros.push(tester));
  }

  /**
   * Replaces macros according to rules, providedin constructor
   * @param  {String} string -- string to resolve (contains macros)
   * @return {String}
   */
  resolve(string) {
    let result = string;
    this.macros.forEach((macro) => {
      const value = macro.provider();
      if (!value) return;
      result = result.replace(macro.rule, value);
    });
    return result;
  }

}

module.exports = MacrosResolver;
