/**
 * Viewer of snow cover table from [hydro.imgw.pl](https://hydro.imgw.pl)
 * website.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 * @licence MIT
 */

/* global m Config */
const names = Object.keys(Config.cols);

const curDate = (d => [
  d.getFullYear(),
  d.toLocaleString('default', { month: '2-digit' }),
  d.toLocaleString('default', { day: '2-digit' })
].join(''))(new Date());

const Favorites = {
  list: new Set(localStorage.getItem('favorite')?.split(',') ?? []),
  on: JSON.parse(localStorage.getItem('on') ?? false),
  search: null,
};

/* global Stream */
const Search = new Stream(null);

const Message = new Stream(null);

const Data = {
  date: localStorage.getItem('date'),
  survey: JSON.parse(localStorage.getItem('survey')) ?? [],
  filtered: () => Data.survey
    .filter(e => parseInt(e[2] ?? 0) >= localStorage.getItem('min') ?? 1)
    .filter(e => !Search() || e.slice(0, 2).reduce((res, val) =>
      res || val.toLowerCase().indexOf(Search()) > -1, false))
    .filter(e => !Favorites.on || Favorites.list.has(e[0]) ||
    Favorites.list.has(e[1])),
  fetch: function() {
    Message('');
    m.redraw();
    return require('./dataParser.js')
      .default(Config.url, Object.values(Config.cols), Data.date)
      .then(res => {
        Object.assign(Data, res);
        localStorage.setItem('date', Data.date);
        localStorage.setItem('survey', JSON.stringify(Data.survey));
        Message(res.survey?.length === 0 ? 'Brak danych!'
          : res.date !== curDate ? 'Dane przestarzałe, spróbuj później.'
            : null);
        m.redraw();
      }).catch(e => {
        console.log(JSON.stringify(e));
        Message('Błąd pobierania danych!');
        m.redraw();
      });
  }
};

(resizer => {
  window.addEventListener('resize', resizer);
  new MutationObserver(resizer).observe(document.getElementById('header'),
    { attributes: true, childList: true, subtree: true });
})(() => {
  const table = document.querySelector('table');
  const footer = document.getElementById('footer');
  const maxHeight = window.innerHeight - footer.offsetHeight -
    table.offsetTop;
  const highEnough = (table.tBodies[0].rows[0]?.offsetHeight ?? 0 +
    table.tHead.offsetHeight) < maxHeight;
  highEnough && Object.assign(table.style, { maxHeight: `${maxHeight}px` });
  footer.style.position = highEnough ? 'absolute' : 'relative';
});

document.addEventListener('deviceready', () => {
  /*
  window.cordova.plugins.backgroundMode.enable();
  window.cordova.plugins.backgroundMode.setDefaults({ hidden: true });
  window.cordova.plugins.backgroundMode.overrideBackButton();
  */

  const notification = window.cordova.plugins.notification.local;
  const schedule = trigger => notification.schedule(Object.assign(
    { id: 1, silent: true },
    trigger ? { trigger: trigger } : {}
  ), res => console.debug(`scheduled #1 ${JSON.stringify(trigger)}: ${res}`));
  notification?.clearAll(res => console.debug('cleared: ' + res));
  notification?.on('trigger', async function(n) {
    if (!n.id) {
      return;
    }
    console.debug('triggered: ' + JSON.stringify(n));
    let text = null;
    if (Message() !== '' && curDate !== Data.date) {
      await Data.fetch();
      text = curDate !== Data.date ? '' : Data.filtered().map(row => row
        .map((col, idx) => [2, 3].includes(idx) ? parseInt(col)
          : idx === 4 ? Config.type[col] : col))
        .map(row => `${row[0]}: ${row[2]}/ ${row[3]} [cm] ${row[4]}`)
        .join('\n');
    }
    text && (notification?.schedule({ title: Data.date, text: text }) ||
      console.debug('TEXT: ' + text));
    text ?? true
      ? schedule({
        at: (d => {
          d.setDate(d.getDate() + 1);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8);
        })(new Date())
      })
      : schedule({ in: 30, unit: 'minute' });
  });
  notification?.isScheduled(1, res => res || schedule());
});

m.mount(document.getElementById('message'), {
  view: vnode => Message() === '' ? m('div.spinner') : Message()
    ? m('span.warrning', Message()) : null
});

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
    m('tbody', Data.filtered()
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
      m('span#favorite.tooltip' + (Favorites.on ? '.on' : ''), {
        'aria-label': 'Ulubione',
        onclick: e => {
          e.target.classList.toggle('on');
          (val => Object.assign(Favorites, { on: val }) &&
            localStorage.setItem('on', val))(e.target.classList.contains('on'));
        }
      }),
      m('span#search.tooltip.icon-search', {
        'aria-label': 'Szukaj',
        onclick: e => Search() || Search(Search() === null ? '' : null)
      }),
      m('span#reset.tooltip', {
        'aria-label': 'Resetuj',
        onclick: e => !confirm('Resetować ustawienia?') ||
          ['min', 'favorite', 'on'].forEach(f =>
            localStorage.removeItem(f)) ||
            Search(null) ||
            Object.assign(Favorites, { list: new Set([]), on: false })
      }),
      m('span#reload.tooltip', {
        'aria-label': 'Odśwież',
        onclick: e =>
          ['survey', 'date'].forEach(f => localStorage.removeItem(f)) ||
          location.reload()
      }),
    ]),
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
      m('input' + (Search() === null ? '.hidden' : ''), {
        name: 'search',
        placeholder: 'Szukaj',
        value: Search(),
        size: 5,
        onblur: e => Search() || Search(null),
        oninput: e => Search(e.target.value.toLowerCase())
      }),
    ])
  ]
});
