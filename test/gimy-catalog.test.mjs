import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('catalog endpoint extracts title-only results from IYF Search categories', async () => {
  const catalogFunction = await readFile(
    new URL('../functions/gimy-catalog.js', import.meta.url),
    'utf8',
  );

  assert.match(catalogFunction, /const IYF_SEARCH_ENDPOINT = 'https:\/\/m10\.iyf\.tv\/api\/list\/Search'/);
  assert.match(catalogFunction, /context\.env\?\.IYF_VV/);
  assert.match(catalogFunction, /context\.env\?\.IYF_PUB/);
  assert.match(catalogFunction, /Catalog source rejected the request/);
  assert.match(catalogFunction, /const IYF_SECTION_CIDS/);
  assert.match(catalogFunction, /电影: '0,1'/);
  assert.match(catalogFunction, /电视剧: '0,1,4'/);
  assert.match(catalogFunction, /综艺: '0,3'/);
  assert.match(catalogFunction, /动漫: '0,4'/);
  assert.match(catalogFunction, /短剧: '0,25'/);
  assert.match(catalogFunction, /genre: url\.searchParams\.get\('genre'\) \|\| '全部类型'/);
  assert.match(catalogFunction, /payload\.data\?\.info/);
  assert.match(catalogFunction, /searchParams\.set\('cinema', '1'\)/);
  assert.match(catalogFunction, /searchParams\.set\('cid', IYF_SECTION_CIDS\[filter\.category\]/);
  assert.match(catalogFunction, /if \(genre\) searchParams\.set\('category', genre\)/);
  assert.match(catalogFunction, /searchParams\.set\('orderby', String\(orderby\)\)/);
  assert.match(catalogFunction, /searchParams\.set\('isserial', filter\.isserial \?\? '-1'\)/);
  assert.match(catalogFunction, /extractTitlesFromIyfPayload/);
  assert.match(catalogFunction, /jsonResponse\(\{ category, source: 'iyf', titles \}\)/);
  assert.doesNotMatch(catalogFunction, /m3u8|\.mp4|\.ts/);
});

test('browse filters use IYF title-only catalog without Douban fallback', async () => {
  const doubanScript = await readFile(new URL('../js/douban.js', import.meta.url), 'utf8');

  assert.match(doubanScript, /const iyfFilterGroups/);
  assert.match(doubanScript, /key: 'category'.*电影.*电视剧.*综艺.*动漫.*短剧/s);
  assert.match(doubanScript, /key: 'region'.*大陆.*香港.*台湾.*日本.*韩国.*欧美.*英国.*泰国.*其它/s);
  assert.match(doubanScript, /key: 'language'.*国语.*粤语.*英语.*韩语.*日语/s);
  assert.match(doubanScript, /key: 'year'.*今年.*去年.*更早.*90年代.*80年代.*怀旧/s);
  assert.match(doubanScript, /key: 'vipResource'.*4K.*1080P.*900P.*720P/s);
  assert.match(doubanScript, /key: 'isserial'.*全集.*连载中/s);
  assert.match(doubanScript, /const catalogTitles = await fetchGimyCatalogTitles\(pageStart, pageSize\)/);
  assert.match(doubanScript, /subjects = catalogTitles\.map\(title => \(\{ title, titleOnly: true \}\)\)/);
  assert.match(doubanScript, /加载失败：\$\{error\.message/);
  assert.doesNotMatch(doubanScript, /movie\.douban\.com\/j\/search_subjects[\s\S]*renderDoubanRecommendationRow/);
});

test('browse category sort buttons map to IYF order ids 0 through 3', async () => {
  const [indexHtml, doubanScript] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../js/douban.js', import.meta.url), 'utf8'),
  ]);

  assert.match(indexHtml, /id="douban-orderby"/);
  assert.match(indexHtml, /data-douban-orderby="0"[^>]*>添加时间/);
  assert.match(indexHtml, /data-douban-orderby="1"[^>]*>更新时间/);
  assert.match(indexHtml, /data-douban-orderby="2"[^>]*>人气高低/);
  assert.match(indexHtml, /data-douban-orderby="3"[^>]*>评分高低/);
  assert.match(doubanScript, /let doubanCatalogOrderby = '0'/);
  assert.match(doubanScript, /setupDoubanOrderNavigation/);
  assert.match(doubanScript, /orderby=\$\{encodeURIComponent\(doubanCatalogOrderby\)\}/);
  assert.match(doubanScript, /category=\$\{encodeURIComponent\(iyfCatalogFilters\.category\)\}/);
  assert.match(doubanScript, /genre=\$\{encodeURIComponent\(iyfCatalogFilters\.genre\)\}/);
  assert.match(doubanScript, /region=\$\{encodeURIComponent\(iyfCatalogFilters\.region\)\}/);
  assert.match(doubanScript, /language=\$\{encodeURIComponent\(iyfCatalogFilters\.language\)\}/);
  assert.match(doubanScript, /year=\$\{encodeURIComponent\(iyfCatalogFilters\.year\)\}/);
  assert.match(doubanScript, /vipResource=\$\{encodeURIComponent\(iyfCatalogFilters\.vipResource\)\}/);
  assert.match(doubanScript, /isserial=\$\{encodeURIComponent\(iyfCatalogFilters\.isserial\)\}/);
});

test('local Express server exposes the same catalog route', async () => {
  const serverScript = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');

  assert.match(serverScript, /handleGimyCatalogRequest/);
  assert.match(serverScript, /app\.get\('\/gimy-catalog'/);
});