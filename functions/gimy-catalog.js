const IYF_SEARCH_ENDPOINT = 'https://m10.iyf.tv/api/list/Search';

const DEFAULT_IYF_AUTH_PARAMS = Object.freeze({
    vv: 'f636ff179572c4199d578b05f1d065cc',
    pub: 'CJSuEJ4nCZCmC2uqCpDVI4jVCJ4oBZ4oC2upC2unC3LVD3HXOsGrOpKnDJ9cD64pDZauDc9YPZapDs5ZDcGtE6LVDpHYDJTXDJHaCp5bC34mEJ0qE6DbE6HaEJ8uOJKqP61',
});

const IYF_SECTION_CIDS = Object.freeze({
    全部版块: '0,1,4',
    电影: '0,1',
    电视剧: '0,1,4',
    综艺: '0,3',
    动漫: '0,4',
    短剧: '0,25',
    体育: '0',
    纪录片: '0,1,4',
    华人: '0',
    游戏: '0',
    新闻: '0',
    娱乐: '0',
    生活: '0',
    音乐: '0',
    时尚: '0',
    科技: '0',
});

const TITLE_KEYS = ['title', 'name', 'vod_name', 'vodName', 'videoName', 'cnname', 'showName', 'albumName'];

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Cache-Control': status >= 400 ? 'no-store' : 'public, max-age=300',
        },
    });
}

function parsePositiveInteger(value, fallback, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(parsed, max);
}

function parseOrderby(value) {
    return ['0', '1', '2', '3'].includes(value) ? value : '0';
}

function normalizeFilterValue(value, allValue = '全部') {
    return value && value !== allValue && value !== '全部版块' && value !== '全部类型' ? value : '';
}

function buildIyfSearchUrl(filter, page, size, orderby, authParams) {
    const iyfUrl = new URL(IYF_SEARCH_ENDPOINT);
    const { searchParams } = iyfUrl;

    searchParams.set('cinema', '1');
    searchParams.set('page', String(page));
    searchParams.set('size', String(size));
    searchParams.set('orderby', String(orderby));
    searchParams.set('desc', '1');
    searchParams.set('cid', IYF_SECTION_CIDS[filter.category] || '0,1,4');
    searchParams.set('isserial', filter.isserial ?? '-1');
    searchParams.set('isIndex', filter.isIndex ?? '-1');
    searchParams.set('isfree', filter.isfree ?? '-1');
    searchParams.set('isVertical', filter.isVertical ?? '-1');

    Object.entries(authParams).forEach(([key, value]) => searchParams.set(key, value));
    ['region', 'language', 'year', 'vipResource'].forEach(key => {
        const value = normalizeFilterValue(filter[key]);
        if (value) searchParams.set(key, value);
    });

    const genre = normalizeFilterValue(filter.genre, '全部类型');
    if (genre) searchParams.set('category', genre);

    return iyfUrl.toString();
}

function firstListInPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const candidates = [payload.list, payload.data?.info, payload.data?.list, payload.data?.items, payload.result?.list, payload.rows, payload.data];
    return candidates.find(Array.isArray) || [];
}

function titleFromItem(item) {
    if (!item || typeof item !== 'object') return '';

    for (const key of TITLE_KEYS) {
        const value = item[key];
        if (typeof value === 'string' && value.trim()) return value.replace(/\s+/g, ' ').trim();
    }

    return '';
}

function extractTitlesFromIyfPayload(payload, limit) {
    const seen = new Set();
    const titles = [];

    for (const item of firstListInPayload(payload)) {
        const title = titleFromItem(item);
        if (!title || seen.has(title)) continue;
        seen.add(title);
        titles.push(title);
        if (titles.length >= limit) break;
    }

    return titles;
}

function summarizePayloadShape(value, depth = 0) {
    if (depth > 3) return typeof value;
    if (Array.isArray(value)) {
        return {
            type: 'array',
            length: value.length,
            first: value.length ? summarizePayloadShape(value[0], depth + 1) : null,
        };
    }
    if (!value || typeof value !== 'object') return typeof value;

    return {
        type: 'object',
        keys: Object.keys(value).slice(0, 20),
        children: Object.fromEntries(Object.entries(value).slice(0, 8).map(([key, child]) => [key, summarizePayloadShape(child, depth + 1)])),
    };
}

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category') || '电视剧';
    const filter = {
        category,
        genre: url.searchParams.get('genre') || '全部类型',
        region: url.searchParams.get('region') || '全部',
        language: url.searchParams.get('language') || '全部',
        year: url.searchParams.get('year') || '全部',
        vipResource: url.searchParams.get('vipResource') || '全部',
        isserial: url.searchParams.get('isserial') || '-1',
    };

    const page = parsePositiveInteger(url.searchParams.get('page'), 1, 100);
    const size = parsePositiveInteger(url.searchParams.get('size'), 36, 36);
    const orderby = parseOrderby(url.searchParams.get('orderby'));
    const authParams = {
        vv: context.env?.IYF_VV || DEFAULT_IYF_AUTH_PARAMS.vv,
        pub: context.env?.IYF_PUB || DEFAULT_IYF_AUTH_PARAMS.pub,
    };

    try {
        const filters = [filter, ...(filter.fallbacks || [])];
        let payload = null;
        let titles = [];

        for (const currentFilter of filters) {
            const source = await fetch(buildIyfSearchUrl(currentFilter, page, size, orderby, authParams), {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://m10.iyf.tv/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                },
            });
            if (!source.ok) continue;

            payload = await source.json();
            if (payload?.data?.code && payload.data.code !== 0) {
                return jsonResponse({
                    error: 'Catalog source rejected the request',
                    source: 'iyf',
                    message: payload.data.msg || 'Unknown IYF error',
                }, 502);
            }
            titles = extractTitlesFromIyfPayload(payload, size);
            if (titles.length) break;
        }

        if (url.searchParams.get('debug') === '1') {
            return jsonResponse({
                category,
                source: 'iyf',
                upstream: {
                    ret: payload?.ret,
                    msg: payload?.msg,
                    code: payload?.data?.code,
                    dataMsg: payload?.data?.msg,
                },
                shape: summarizePayloadShape(payload),
            });
        }

        return jsonResponse({ category, source: 'iyf', titles });
    } catch {
        return jsonResponse({ error: 'Catalog source is unavailable' }, 502);
    }
}