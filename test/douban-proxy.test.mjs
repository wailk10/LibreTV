import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('proxy returns Douban cover images', async () => {
  const coverUrl = 'https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2933198755.jpg';
  const response = await fetch(`http://localhost:8080/proxy/${encodeURIComponent(coverUrl)}`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^image\//);
});

test('Douban cards load covers through the proxy first', async () => {
  const doubanScript = await readFile(new URL('../js/douban.js', import.meta.url), 'utf8');

  assert.match(doubanScript, /<img src="\$\{proxiedCoverUrl\}"/);
});

test('Douban cover requests bypass cached responses from the previous proxy version', async () => {
  const doubanScript = await readFile(new URL('../js/douban.js', import.meta.url), 'utf8');

  assert.match(doubanScript, /image-version=2/);
});

test('homepage renders three Douban TV recommendation rows', async () => {
  const [indexHtml, doubanScript] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../js/douban.js', import.meta.url), 'utf8'),
  ]);

  assert.match(indexHtml, /id="douban-tv-rows"/);
  assert.match(indexHtml, /近期值得看的国产剧/);
  assert.match(indexHtml, /近期值得看的综艺节目/);
  assert.match(indexHtml, /近期值得看的英美剧/);
  assert.match(doubanScript, /function renderDoubanRecommendationRows\s*\(/);
});

test('homepage renders a dynamic recent Hong Kong drama recommendation row', async () => {
  const [indexHtml, doubanScript] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../js/douban.js', import.meta.url), 'utf8'),
  ]);

  assert.match(indexHtml, /近期值得看的港剧/);
  assert.match(indexHtml, /data-douban-row="hong-kong"/);
  assert.match(doubanScript, /\{ id: 'hong-kong', tag: '港剧' \}/);
});

test('Douban TV rows wrap into a desktop grid while mobile stays scrollable', async () => {
  const indexStyles = await readFile(new URL('../css/index.css', import.meta.url), 'utf8');

  assert.match(indexStyles, /\.douban-tv-row__content\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(indexStyles, /@media\s*\(min-width:\s*641px\)\s*\{[\s\S]*\.douban-tv-row__content\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)[\s\S]*overflow-x:\s*visible/);
});

test('each Douban TV row loads its next page in place', async () => {
  const [indexHtml, doubanScript] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../js/douban.js', import.meta.url), 'utf8'),
  ]);

  assert.match(indexHtml, /<button[^>]*data-douban-load-more[^>]*>更多<\/button>/);
  assert.doesNotMatch(indexHtml, /href="https:\/\/m\.douban\.com\/tv\//);
  assert.match(doubanScript, /const doubanRecommendationPageSize = 12/);
  assert.match(doubanScript, /page_start=\$\{pageStart\}/);
    assert.match(doubanScript, /pageStart \+ pageSize/);
  assert.match(doubanScript, /loadMoreButton\.disabled = true/);
  assert.match(doubanScript, /loadMoreButton\.disabled = false/);
});

test('Douban TV load-more controls follow the cards as the final row item', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(indexHtml, /data-douban-content><\/div>\s*<button[^>]*data-douban-load-more/);
});

test('homepage has Gimy-style category navigation backed by Douban tags', async () => {
  const [indexHtml, doubanScript] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../js/douban.js', import.meta.url), 'utf8'),
  ]);

  assert.match(indexHtml, /data-douban-category="home"/);
  assert.match(indexHtml, /data-douban-category="drama"/);
  assert.match(indexHtml, /data-douban-category="anime"/);
  assert.match(indexHtml, /data-douban-category="variety"/);
  assert.match(indexHtml, /data-douban-category="movie"/);
  assert.match(indexHtml, /data-douban-category="shortDrama"/);
  assert.match(indexHtml, /id="douban-subcategories"/);
  assert.match(doubanScript, /const doubanBrowseCategories/);
  assert.match(doubanScript, /function selectDoubanCategory\s*\(/);
  assert.match(doubanScript, /陆剧.*韩剧.*美剧.*日剧.*台剧/);
  assert.match(doubanScript, /动作片.*喜剧片.*爱情片.*科幻片.*恐怖片.*剧情片.*战争片.*动画电影/);
});

test('movie categories load fuller recommendation pages', async () => {
  const doubanScript = await readFile(new URL('../js/douban.js', import.meta.url), 'utf8');

  assert.match(doubanScript, /key: 'category'[\s\S]*'电影'[\s\S]*'电视剧'/);
  assert.match(doubanScript, /key: 'genre'[\s\S]*'动作'[\s\S]*'剧情'/);
  assert.match(doubanScript, /const row = \{ id: 'browse', pageSize: 36 \}/);
});

test('browse categories use only title-only IYF catalog entries', async () => {
  const doubanScript = await readFile(new URL('../js/douban.js', import.meta.url), 'utf8');

  assert.match(doubanScript, /const catalogTitles = await fetchGimyCatalogTitles\(pageStart, pageSize\)/);
  assert.match(doubanScript, /subjects = catalogTitles\.map\(title => \(\{ title, titleOnly: true \}\)\)/);
  assert.match(doubanScript, /titleOnly: true/);
  assert.doesNotMatch(doubanScript, /const target = `https:\/\/movie\.douban\.com\/j\/search_subjects\?type=\$\{row\.type/);
});

test('IYF filter groups include all attached tag rows', async () => {
  const doubanScript = await readFile(new URL('../js/douban.js', import.meta.url), 'utf8');

  assert.match(doubanScript, /key: 'region'[\s\S]*'大陆'[\s\S]*'香港'[\s\S]*'台湾'/);
  assert.match(doubanScript, /key: 'language'[\s\S]*'国语'[\s\S]*'粤语'[\s\S]*'英语'/);
  assert.match(doubanScript, /key: 'year'[\s\S]*'今年'[\s\S]*'去年'[\s\S]*'更早'/);
  assert.match(doubanScript, /key: 'vipResource'[\s\S]*'4K'[\s\S]*'1080P'[\s\S]*'720P'/);
  assert.match(doubanScript, /key: 'isserial'[\s\S]*\['全集', '1'\][\s\S]*\['连载中', '0'\]/);
});

test('select all resources includes custom API checkboxes', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /document\.querySelectorAll\('#customApisList input\[type="checkbox"\]'\)/);
});

// ---- OpenCC Traditional-to-Simplified Search Conversion ----

test('OpenCC converter construction from tw to cn', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /OpenCC\.Converter\s*\(\s*\{\s*from:\s*['"]tw['"]\s*,\s*to:\s*['"]cn['"]\s*\}\s*\)/);
});

test('compositionend listener on searchInput', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /searchInput\.addEventListener\s*\(\s*['"]compositionend['"]/);
});

test('input listener on searchInput', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /searchInput\.addEventListener\s*\(\s*['"]input['"]/);
});

test('opencc-js browser script served from dedicated Express route', async () => {
  const serverScript = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');

  assert.match(serverScript, /opencc/);
  assert.match(serverScript, /express\.static/);
});

test('opencc-js script tag in index.html before app.js', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  const appJsPos = indexHtml.indexOf('js/app.js');
  const openccPos = indexHtml.indexOf('opencc-js');
  assert.ok(openccPos > -1, 'opencc-js reference must exist in index.html');
  assert.ok(openccPos < appJsPos, 'opencc-js script must appear before js/app.js');
});

test('default API selection records a one-time migration marker', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /hasMigratedDefaultApiSelection/);
});

test('default API selection derives visible resources from API_SITES', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /Object\.keys\(API_SITES\).*filter[\s\S]*?!API_SITES\[apiKey\]\.adult/);
});

test('saved API selections are reset to all available APIs once', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /forceAllApiSelectionVersion/);
  assert.match(appScript, /customAPIs\.map\(\(_, index\) => `custom_\$\{index\}`\)/);
});

test('removed supplemental API resources are absent and saved selections refresh', async () => {
  const [appScript, configScript] = await Promise.all([
    readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../js/config.js', import.meta.url), 'utf8'),
  ]);

  assert.match(appScript, /forceAllApiSelectionVersion = '2'/);
  assert.doesNotMatch(configScript, /hongniu|lehuo/);
});

test('missing Douban recommendation preference defaults to enabled', async () => {
  const appScript = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(appScript, /localStorage\.getItem\('doubanEnabled'\)\s*===\s*null/);
});

  test('version notice uses the requested ReEdit attribution', async () => {
    const versionScript = await readFile(new URL('../js/version-check.js', import.meta.url), 'utf8');

    assert.doesNotMatch(versionScript, /发现新版/);
    assert.match(versionScript, /ReEdit By WILLIAM/);
  });

test('Pages proxy uses the Douban movie referer for image CDN requests', async () => {
  const pagesProxy = await readFile(new URL('../functions/proxy/[[path]].js', import.meta.url), 'utf8');

  assert.match(pagesProxy, /doubanio\.com/);
  assert.match(pagesProxy, /https:\/\/movie\.douban\.com\//);
});

test('Pages proxy streams binary image bodies without text decoding', async () => {
  const pagesProxy = await readFile(new URL('../functions/proxy/[[path]].js', import.meta.url), 'utf8');

  assert.match(pagesProxy, /response\.body/);
  assert.match(pagesProxy, /contentType\.startsWith\(['"]image\/['"]\)/);
});