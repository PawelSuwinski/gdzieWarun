/**
 * Parse snow cover pdf file from [hydro.imgw.pl](https://hydro.imgw.pl).
 *
 * @author Paweł Suwiński, psuw@wp.pl
 * @licence MIT
 */

export default async function(url, regs, savedDate = null) {
  const pdf = require('pdfjs-dist');
  pdf.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.bundle.js';
  const doc = await pdf.getDocument(url + '?_=' + Date.now()).promise;
  const pdfDate = (await doc.getMetadata()).info.CreationDate.substring(2, 10);
  return savedDate && pdfDate <= savedDate ? {} : {
    date: pdfDate,
    survey: (await Promise.all([...new Array(doc.numPages).keys()]
      .map(async n => (await (await doc.getPage(n + 1)).getTextContent())
        .items
        .reduce((survey, item) => {
          if (item.str.match(/^[0-9]+\.$/)) {
            return [...survey, []];
          }
          if (survey.length === 0) {
            return survey;
          }
          const cur = survey.slice(-1)[0];
          return cur.length <= 4 &&
            item.str.match(regs[cur.length]) &&
            !(cur[3] ?? '0').match(regs[4])
            ? [...survey.slice(0, survey.length - 1), [...cur, item.str]]
            : survey;
        }, [])
        .filter(e => e.slice(-1)[0].match(regs.slice(-1)[0]))
        .map(e => e.length === 5 ? e : [...e.slice(0, 3), 0, e.slice(-1)[0]])
      ))).reduce((survey, res) => survey.concat(res), [])
  };
}
