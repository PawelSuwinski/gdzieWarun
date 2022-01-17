/**
 * Config.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 * @licence MIT
 */

export default {
  url: 'https://res4.imgw.pl/products/hydro/monitor-lite-products/Pokrywa_sniezna.pdf',
  type: ' puszysty świeży krupiasty zsiadły zbity mokry szreń lodoszreń firn szadź'.split(' '),
  cols: {
    Stacja: /^[\p{Lu} -]+$/gu,
    Województwo: /^[\p{Ll}-]+$/gu,
    Grubość: /^[0-9]+,[0-9]+$/,
    Świeży: /^([0-9]+,[0-9]+|[1-8])$/,
    Gatunek: /^[1-8]$/
  }
};
