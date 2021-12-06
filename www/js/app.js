/**
 * Viewer of snow cover table from [hydro.imgw.pl](https://hydro.imgw.pl)
 * website.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 * @licence MIT
 */

/* global m */
const Config = {
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
const names = Object.keys(Config.cols);

const curDate = (d => [
  d.getFullYear(),
  d.toLocaleString('default', { month: '2-digit' }),
  d.toLocaleString('default', { day: '2-digit' })
].join(''))(new Date());

/* global dataParser */
const Data = {
  date: localStorage.getItem('date'),
  survey: JSON.parse(localStorage.getItem('survey')) ?? [],
  msg: (msg, spinner = false, type = 'info') =>
    m.render(document.getElementById('message'), [
      msg ? m('span.' + type, msg) : null,
      spinner ? m('div.spinner') : null
    ]),
  warrning: msg => Data.msg(msg, false, 'warrning'),
  error: msg => Data.msg(msg, false, 'error'),
  fetch: function() {
    Data.msg('', true);
    dataParser(Config.url, Object.values(Config.cols), Data.date)
      .then(res => {
        console.log(res);
        Object.assign(Data, res);
        localStorage.setItem('date', Data.date);
        localStorage.setItem('survey', JSON.stringify(Data.survey));
        res.survey?.length === 0 ? Data.warrning('Brak danych!')
          : res.date === curDate ? Data.msg(null)
            : Data.warrning('Dane przestarzałe, spróbuj później.');
        m.redraw();
      }).catch(e => Data.error('Błąd pobierania danych!'));
  }
};

const Favorites = {
  list: new Set(localStorage.getItem('favorite')?.split(',') ?? []),
  on: JSON.parse(localStorage.getItem('on') ?? false),
};

m.mount(document.getElementById('data'), {
  oninit: vnode => curDate !== Data.date && Data.fetch(),
  view: vnode => [m('p', Data.date), m('table.striped', {
    onclick: e => e.target.parentNode.tagName === 'TD' &&
      e.target.parentNode.classList.contains(names[0]) && (
      Favorites.list.has(e.target.innerText)
        ? Favorites.list.delete(e.target.innerText)
        : Favorites.list.add(e.target.innerText)
    ) && localStorage.setItem('favorite', Array.from(Favorites.list))
  }, [
    m('thead', m('tr', names.filter((col, idx) => idx % 2 === 0)
      .map(col => m('th.' + col, col)))),
    m('tbody', Data.survey
      .filter(e => parseInt(e[2] ?? 0) >= localStorage.getItem('min') ?? 1)
      .filter(e => !Favorites.on || Favorites.list.has(e[0]) ||
        Favorites.list.has(e[1]))
      .map(e => m('tr', names.filter((col, idx) => idx % 2 === 0)
        .map((col, idx) => m('td.' + col,
          idx === 0
            ? [0, 1].map(idx => m('div' +
              (Favorites.list.has(e[idx]) ? '.favorite' : ''), e[idx]))
            : idx === 1
              ? [2, 3].map(idx => m('span', parseInt(e[idx])))
              : Config.type[e[idx + 2]]
        ))
      ))
    ),
  ])]
});

m.mount(document.getElementById('filters'), {
  view: vnode => [
    m('div.responsive-margin', [
      m('input', {
        name: 'min',
        type: 'range',
        min: 1,
        max: 50,
        step: 1,
        value: localStorage.getItem('min') ?? 1,
        onchange: e => localStorage.setItem('min', e.target.value)
      }),
      m('p', `min: ${localStorage.getItem('min') ?? 1} cm`),
    ]),
    m('div.responsive-margin', [
      m('span#favorite.tooltip' + (Favorites.on ? '.on' : ''), {
        'aria-label': 'Ulubione',
        onclick: e => {
          e.target.classList.toggle('on');
          (val => Object.assign(Favorites, { on: val }) &&
            localStorage.setItem('on', val))(e.target.classList.contains('on'));
        }
      }),
      m('span#reset.tooltip', {
        'aria-label': 'Resetuj',
        onclick: e => ['min', 'favorite', 'on'].forEach(f =>
          localStorage.removeItem(f)) ||
          Object.assign(Favorites, { list: new Set([]), on: false })
      }),
      m('span#reload.tooltip', {
        'aria-label': 'Odśwież',
        onclick: e =>
          ['survey', 'date'].forEach(f => localStorage.removeItem(f)) ||
          location.reload()
      })
    ])
  ]
});
