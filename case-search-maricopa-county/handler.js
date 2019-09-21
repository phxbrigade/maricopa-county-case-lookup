const axios = require('axios');
const cheerio = require('cheerio');

const resolve = async ({ caseId }) => {
  const parsedId = String(caseId).replace(' ', '').replace('-', '');
  const url = `http://courtminutes.maricopa.gov/JONamesearch.asp?department=&casenumber=${parsedId}`;

  const response = await axios.get(url);
  const dom = cheerio.load(response.data);

  const raw = Array.from(dom('body > form > div > table > tbody > tr > td > p.body10pt > table > tbody > tr > td > a'));
  return raw.map((v) => {
    if (v.name !== 'a') return null;
    const cl = v.attribs.onclick;
    const parsed = String(cl).match(/(["'])(\\?.)*?\1/)[0].replace(/'/g, '');
    if (!parsed) return null;
    if (parsed.includes('Crim')) return `http://courtminutes.maricopa.gov/docs/${parsed}`;
    return `http://courtminutes.maricopa.gov/docs/orders/${parsed}.pdf`;
  }).filter((v) => v);
}

module.exports.search = async (event, _ctx, cb) => {
  const body = JSON.parse(event.body);
  const res = await resolve(body);
  cb(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(res)
  });
}
