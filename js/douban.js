// 豆瓣热门电影电视剧推荐功能

// 豆瓣标签列表 - 修改为默认标签
let defaultMovieTags = ['热门', '最新', '经典', '豆瓣高分', '冷门佳片', '华语', '欧美', '韩国', '日本', '动作', '喜剧', '日综', '爱情', '科幻', '悬疑', '恐怖', '治愈'];
let defaultTvTags = ['热门', '美剧', '英剧', '韩剧', '日剧', '国产剧', '港剧', '日本动画', '综艺', '纪录片'];

// 用户标签列表 - 存储用户实际使用的标签（包含保留的系统标签和用户添加的自定义标签）
let movieTags = [];
let tvTags = [];

// 加载用户标签
function loadUserTags() {
    try {
        // 尝试从本地存储加载用户保存的标签
        const savedMovieTags = localStorage.getItem('userMovieTags');
        const savedTvTags = localStorage.getItem('userTvTags');

        // 如果本地存储中有标签数据，则使用它
        if (savedMovieTags) {
            movieTags = JSON.parse(savedMovieTags);
        } else {
            // 否则使用默认标签
            movieTags = [...defaultMovieTags];
        }

        if (savedTvTags) {
            tvTags = JSON.parse(savedTvTags);
        } else {
            // 否则使用默认标签
            tvTags = [...defaultTvTags];
        }
    } catch (e) {
        console.error('加载标签失败：', e);
        // 初始化为默认值，防止错误
        movieTags = [...defaultMovieTags];
        tvTags = [...defaultTvTags];
    }
}

// 保存用户标签
function saveUserTags() {
    try {
        localStorage.setItem('userMovieTags', JSON.stringify(movieTags));
        localStorage.setItem('userTvTags', JSON.stringify(tvTags));
    } catch (e) {
        console.error('保存标签失败：', e);
        showToast('保存标签失败', 'error');
    }
}

let doubanMovieTvCurrentSwitch = 'movie';
let doubanCurrentTag = '热门';
let doubanPageStart = 0;
let doubanCatalogOrderby = '0';
const doubanPageSize = 16; // 一次显示的项目数量
const iyfCatalogFilters = {
    category: '电视剧',
    genre: '全部类型',
    region: '全部',
    language: '全部',
    year: '全部',
    vipResource: '全部',
    isserial: '-1',
};
const iyfFilterGroups = [
    { key: 'category', label: '版块', allLabel: '全部版块', options: ['全部版块', '电影', '电视剧', '综艺', '动漫', '短剧', '体育', '纪录片', '华人', '游戏', '新闻', '娱乐', '生活', '音乐', '时尚', '科技'] },
    { key: 'genre', label: '分类', allLabel: '全部类型', options: ['全部类型', '偶像', '爱情', '言情', '古装', '历史', '玄幻', '谍战', '历险', '都市', '科幻', '军旅', '喜剧', '武侠', '江湖', '罪案', '青春', '家庭', '战争', '悬疑', '穿越', '宫廷', '神话', '商战', '警匪', '动作', '惊悚', '剧情', '同性', '奇幻'] },
    { key: 'region', label: '地区', allLabel: '全部', options: ['全部', '大陆', '香港', '台湾', '日本', '韩国', '欧美', '英国', '泰国', '其它'] },
    { key: 'language', label: '语言', allLabel: '全部', options: ['全部', '国语', '粤语', '英语', '韩语', '日语', '西班牙语', '法语', '德语', '意大利语', '泰国语', '其它'] },
    { key: 'year', label: '年份', allLabel: '全部', options: ['全部', '今年', '去年', '更早', '90年代', '80年代', '怀旧'] },
    { key: 'vipResource', label: '画质', allLabel: '全部', options: ['全部', '4K', '1080P', '900P', '720P'] },
    { key: 'isserial', label: '状态', allLabel: '-1', options: [['全部', '-1'], ['全集', '1'], ['连载中', '0']] },
];
const doubanTvRecommendationRows = [
    { id: 'chinese', tag: '国产剧' },
    { id: 'hong-kong', tag: '港剧' },
    { id: 'variety', tag: '综艺' },
    { id: 'western', tag: '美剧' },
];
const doubanBrowseCategories = {
    drama: { title: '热门电视剧', type: 'tv', subcategories: [['全部', '热门', 'drama'], ['陆剧', '国产剧', 'mainlandDrama'], ['韩剧', '韩剧', 'koreaDrama'], ['美剧', '美剧', 'westernDrama'], ['日剧', '日剧', 'japanDrama'], ['台剧', '台剧', 'taiwanDrama'], ['海外剧', '欧美', 'westernDrama'], ['香港', '港剧', 'hongKongDrama'], ['纪录片', '纪录片', 'documentary']] },
    anime: { title: '热门动漫', type: 'tv', subcategories: [['全部', '日本动画', 'anime'], ['日本动画', '日本动画', 'japanAnime'], ['国产动画', '国产动画', 'mainlandAnime'], ['动画', '动画', 'anime']] },
    variety: { title: '热门综艺', type: 'tv', subcategories: [['全部', '综艺', 'variety'], ['华语综艺', '综艺', 'mainlandVariety'], ['日韩综艺', '日韩综艺', 'koreaJapanVariety']] },
    movie: { title: '热门电影', type: 'movie', pageSize: 24, subcategories: [['全部', '热门', 'movie'], ['动作片', '动作', 'movieAction'], ['喜剧片', '喜剧', 'movieComedy'], ['爱情片', '爱情', 'movieRomance'], ['科幻片', '科幻', 'movieScienceFiction'], ['恐怖片', '恐怖', 'movieHorror'], ['剧情片', '剧情', 'movieDrama'], ['战争片', '战争', 'movieWar'], ['动画电影', '动画', 'movieAnimation']] },
    shortDrama: { title: '热门短剧', type: 'tv', subcategories: [['全部', '短剧', 'shortDrama']] },
};
const doubanRecommendationPageSize = 12;
const doubanRecommendationPages = new Map();
let doubanCurrentBrowseRow = null;

// 初始化豆瓣功能
function initDouban() {
    // 设置豆瓣开关的初始状态
    const doubanToggle = document.getElementById('doubanToggle');
    if (doubanToggle) {
        const isEnabled = localStorage.getItem('doubanEnabled') === 'true';
        doubanToggle.checked = isEnabled;

        // 设置开关外观
        const toggleBg = doubanToggle.nextElementSibling;
        const toggleDot = toggleBg.nextElementSibling;
        if (isEnabled) {
            toggleBg.classList.add('bg-pink-600');
            toggleDot.classList.add('translate-x-6');
        }

        // 添加事件监听
        doubanToggle.addEventListener('change', function (e) {
            const isChecked = e.target.checked;
            localStorage.setItem('doubanEnabled', isChecked);

            // 更新开关外观
            if (isChecked) {
                toggleBg.classList.add('bg-pink-600');
                toggleDot.classList.add('translate-x-6');
            } else {
                toggleBg.classList.remove('bg-pink-600');
                toggleDot.classList.remove('translate-x-6');
            }

            // 更新显示状态
            updateDoubanVisibility();
        });

        // 初始更新显示状态
        updateDoubanVisibility();
        setupDoubanBrowseNavigation();
        setupDoubanOrderNavigation();

        // 滚动到页面顶部
        window.scrollTo(0, 0);
    }

}

// 根据设置更新豆瓣区域的显示状态
function updateDoubanVisibility() {
    const doubanArea = document.getElementById('doubanArea');
    if (!doubanArea) return;

    const isEnabled = localStorage.getItem('doubanEnabled') === 'true';
    const isSearching = document.getElementById('resultsArea') &&
        !document.getElementById('resultsArea').classList.contains('hidden');

    // 只有在启用且没有搜索结果显示时才显示豆瓣区域
    if (isEnabled && !isSearching) {
        doubanArea.classList.remove('hidden');
        renderIyfCatalog(false);
    } else {
        doubanArea.classList.add('hidden');
    }
}

function renderDoubanRecommendationRows() {
    doubanTvRecommendationRows.forEach(row => {
        const rowElement = document.querySelector(`[data-douban-row="${row.id}"]`);
        const content = rowElement?.querySelector('[data-douban-content]');
        const loadMoreButton = rowElement?.querySelector('[data-douban-load-more]');
        if (!content || !loadMoreButton) return;

        if (!doubanRecommendationPages.has(row.id)) {
            doubanRecommendationPages.set(row.id, 0);
            loadMoreButton.addEventListener('click', () => renderDoubanRecommendationRow(row, content, loadMoreButton, true));
        }

        if (content.children.length === 0) renderDoubanRecommendationRow(row, content, loadMoreButton, false);
    });
}

function setupDoubanBrowseNavigation() {
    const categoryNav = document.querySelector('.douban-category-nav');
    const subcategories = document.getElementById('douban-subcategories');
    if (!categoryNav || !subcategories) return;

    categoryNav.replaceChildren();
    subcategories.replaceChildren();

    iyfFilterGroups.forEach((group, groupIndex) => {
        const container = groupIndex === 0 ? categoryNav : document.createElement('div');
        if (groupIndex > 0) {
            container.className = 'douban-subcategories';
            container.dataset.iyfFilterGroup = group.key;
            subcategories.appendChild(container);
        }

        group.options.forEach(option => {
            const label = Array.isArray(option) ? option[0] : option;
            const value = Array.isArray(option) ? option[1] : option;
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            button.dataset.doubanFilterKey = group.key;
            button.dataset.doubanFilterValue = value;
            button.className = iyfCatalogFilters[group.key] === value ? 'is-active' : '';
            button.addEventListener('click', () => selectIyfFilter(group.key, value));
            container.appendChild(button);
        });
    });

    subcategories.classList.remove('hidden');
}

function selectIyfFilter(key, value) {
    iyfCatalogFilters[key] = value;
    document.querySelectorAll(`[data-douban-filter-key="${key}"]`).forEach(button => {
        button.classList.toggle('is-active', button.dataset.doubanFilterValue === value);
    });
    doubanRecommendationPages.set('browse', 0);
    renderIyfCatalog(false);
}

function selectDoubanCategory(categoryId) {
    const isHome = categoryId === 'home';
    const category = doubanBrowseCategories[categoryId];
    if (!isHome && !category) return;

    document.querySelectorAll('[data-douban-category]').forEach(button => {
        button.classList.toggle('is-active', button.dataset.doubanCategory === categoryId);
    });

    const homeRows = document.getElementById('douban-tv-rows');
    const subcategories = document.getElementById('douban-subcategories');
    const orderby = document.getElementById('douban-orderby');
    const browsePanel = document.getElementById('douban-browse-panel');
    if (isHome) {
        homeRows.classList.remove('hidden');
        subcategories.classList.add('hidden');
        orderby.classList.add('hidden');
        browsePanel.classList.add('hidden');
        return;
    }

    homeRows.classList.add('hidden');
    orderby.classList.remove('hidden');
    browsePanel.classList.remove('hidden');
    document.getElementById('douban-browse-title').textContent = category.title;
    renderDoubanSubcategories(categoryId, category);
    selectDoubanSubcategory(category, category.subcategories[0][1], category.subcategories[0][2]);
}

function setupDoubanOrderNavigation() {
    document.querySelectorAll('[data-douban-orderby]').forEach(button => {
        button.addEventListener('click', () => {
            doubanCatalogOrderby = button.dataset.doubanOrderby || '0';
            document.querySelectorAll('[data-douban-orderby]').forEach(item => {
                item.classList.toggle('is-active', item === button);
            });
            if (doubanCurrentBrowseRow) {
                doubanRecommendationPages.set(doubanCurrentBrowseRow.id, 0);
                const content = document.getElementById('douban-browse-content');
                const loadMoreButton = document.getElementById('douban-browse-load-more');
                renderDoubanRecommendationRow(doubanCurrentBrowseRow, content, loadMoreButton, false);
            }
        });
    });
}

function renderDoubanSubcategories(categoryId, category) {
    const subcategories = document.getElementById('douban-subcategories');
    subcategories.replaceChildren();
    subcategories.classList.remove('hidden');
    category.subcategories.forEach(([label, tag, catalogCategory], index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.className = index === 0 ? 'is-active' : '';
        button.addEventListener('click', () => {
            subcategories.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
            selectDoubanSubcategory(category, tag, catalogCategory);
        });
        subcategories.appendChild(button);
    });
}

function selectDoubanSubcategory(category, tag, catalogCategory) {
    const content = document.getElementById('douban-browse-content');
    const loadMoreButton = document.getElementById('douban-browse-load-more');
    const row = { id: 'browse', tag, type: category.type, pageSize: category.pageSize, category, catalogCategory };
    doubanCurrentBrowseRow = row;
    doubanRecommendationPages.set(row.id, 0);
    loadMoreButton.hidden = false;
    loadMoreButton.onclick = () => renderDoubanRecommendationRow(row, content, loadMoreButton, true);
    renderDoubanRecommendationRow(row, content, loadMoreButton, false);
}

async function renderDoubanRecommendationRow(row, content, loadMoreButton, append) {
    const pageStart = doubanRecommendationPages.get(row.id) ?? 0;
    const pageSize = row.pageSize || doubanRecommendationPageSize;
    const buttonText = loadMoreButton.textContent;
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = '加载中...';
    if (!append) content.textContent = '加载中...';

    try {
        if (!append) content.replaceChildren();
        let subjects = [];
        const catalogTitles = await fetchGimyCatalogTitles(pageStart, pageSize);
        subjects = catalogTitles.map(title => ({ title, titleOnly: true }));
        if (!subjects.length) {
            if (!append) content.textContent = '暂无推荐内容';
            loadMoreButton.hidden = true;
            return;
        }
        subjects.forEach(subject => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'douban-tv-card';
            card.addEventListener('click', () => fillAndSearchWithDouban(subject.title));
            const poster = subject.titleOnly ? document.createElement('span') : document.createElement('img');
            poster.className = subject.titleOnly ? 'douban-tv-card__placeholder' : 'douban-tv-card__poster';
            if (!subject.titleOnly) {
                poster.src = PROXY_URL + encodeURIComponent(subject.cover || '') + '?image-version=2';
                poster.alt = subject.title || '豆瓣推荐';
                poster.loading = 'lazy';
                poster.referrerPolicy = 'no-referrer';
            }
            const title = document.createElement('span');
            title.className = 'douban-tv-card__title';
            title.textContent = subject.title || '未命名作品';
            const rating = document.createElement('span');
            rating.className = 'douban-tv-card__rating';
            rating.textContent = subject.rate || '暂无评分';
            card.append(poster, title, rating);
            content.appendChild(card);
        });
        doubanRecommendationPages.set(row.id, pageStart + pageSize);
    } catch (error) {
        if (!append) content.textContent = `加载失败：${error.message || '请稍后重试'}`;
    } finally {
        loadMoreButton.disabled = false;
        loadMoreButton.textContent = buttonText;
    }
}

async function fetchGimyCatalogTitles(category, pageStart = 0, pageSize = doubanRecommendationPageSize) {
    try {
        if (typeof category === 'number') {
            pageSize = pageStart;
            pageStart = category;
        }
        const page = Math.floor(pageStart / pageSize) + 1;
        const response = await fetch(`/gimy-catalog?category=${encodeURIComponent(iyfCatalogFilters.category)}&genre=${encodeURIComponent(iyfCatalogFilters.genre)}&region=${encodeURIComponent(iyfCatalogFilters.region)}&language=${encodeURIComponent(iyfCatalogFilters.language)}&year=${encodeURIComponent(iyfCatalogFilters.year)}&vipResource=${encodeURIComponent(iyfCatalogFilters.vipResource)}&isserial=${encodeURIComponent(iyfCatalogFilters.isserial)}&page=${page}&size=${pageSize}&orderby=${encodeURIComponent(doubanCatalogOrderby)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || 'IYF 分类请求失败');
        return Array.isArray(data.titles) ? data.titles : [];
    } catch (error) {
        throw new Error(error.message || 'IYF 分类请求失败');
    }
}

function renderIyfCatalog(append) {
    const content = document.getElementById('douban-browse-content');
    const loadMoreButton = document.getElementById('douban-browse-load-more');
    const homeRows = document.getElementById('douban-tv-rows');
    const orderby = document.getElementById('douban-orderby');
    const browsePanel = document.getElementById('douban-browse-panel');
    if (!content || !loadMoreButton || !browsePanel) return;

    if (homeRows) homeRows.classList.add('hidden');
    if (orderby) orderby.classList.remove('hidden');
    browsePanel.classList.remove('hidden');
    document.getElementById('douban-browse-title').textContent = '影视分类';

    const row = { id: 'browse', pageSize: 36 };
    doubanCurrentBrowseRow = row;
    if (!append) doubanRecommendationPages.set(row.id, 0);
    loadMoreButton.hidden = false;
    loadMoreButton.onclick = () => renderDoubanRecommendationRow(row, content, loadMoreButton, true);
    renderDoubanRecommendationRow(row, content, loadMoreButton, append);
}

// 只填充搜索框，不执行搜索，让用户自主决定搜索时机
function fillSearchInput(title) {
    if (!title) return;

    // 安全处理标题，防止XSS
    const safeTitle = title
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const input = document.getElementById('searchInput');
    if (input) {
        input.value = safeTitle;

        // 聚焦搜索框，便于用户立即使用键盘操作
        input.focus();

        // 显示一个提示，告知用户点击搜索按钮进行搜索
        showToast('已填充搜索内容，点击搜索按钮开始搜索', 'info');
    }
}

// 填充搜索框并执行搜索
function fillAndSearch(title) {
    if (!title) return;

    // 安全处理标题，防止XSS
    const safeTitle = title
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const input = document.getElementById('searchInput');
    if (input) {
        input.value = safeTitle;
        search(); // 使用已有的search函数执行搜索

        // 同时更新浏览器URL，使其反映当前的搜索状态
        try {
            // 使用URI编码确保特殊字符能够正确显示
            const encodedQuery = encodeURIComponent(safeTitle);
            // 使用HTML5 History API更新URL，不刷新页面
            window.history.pushState(
                { search: safeTitle },
                `搜索: ${safeTitle} - LibreTV`,
                `/s=${encodedQuery}`
            );
            // 更新页面标题
            document.title = `搜索: ${safeTitle} - LibreTV`;
        } catch (e) {
            console.error('更新浏览器历史失败:', e);
        }
    }
}

// 填充搜索框，确保豆瓣资源API被选中，然后执行搜索
async function fillAndSearchWithDouban(title) {
    if (!title) return;

    // 安全处理标题，防止XSS
    const safeTitle = title
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // 确保豆瓣资源API被选中
    if (typeof selectedAPIs !== 'undefined' && !selectedAPIs.includes('dbzy')) {
        // 在设置中勾选豆瓣资源API复选框
        const doubanCheckbox = document.querySelector('input[id="api_dbzy"]');
        if (doubanCheckbox) {
            doubanCheckbox.checked = true;

            // 触发updateSelectedAPIs函数以更新状态
            if (typeof updateSelectedAPIs === 'function') {
                updateSelectedAPIs();
            } else {
                // 如果函数不可用，则手动添加到selectedAPIs
                selectedAPIs.push('dbzy');
                localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

                // 更新选中API计数（如果有这个元素）
                const countEl = document.getElementById('selectedAPICount');
                if (countEl) {
                    countEl.textContent = selectedAPIs.length;
                }
            }

            showToast('已自动选择豆瓣资源API', 'info');
        }
    }

    // 填充搜索框并执行搜索
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = safeTitle;
        await search(); // 使用已有的search函数执行搜索

        // 更新浏览器URL，使其反映当前的搜索状态
        try {
            // 使用URI编码确保特殊字符能够正确显示
            const encodedQuery = encodeURIComponent(safeTitle);
            // 使用HTML5 History API更新URL，不刷新页面
            window.history.pushState(
                { search: safeTitle },
                `搜索: ${safeTitle} - LibreTV`,
                `/s=${encodedQuery}`
            );
            // 更新页面标题
            document.title = `搜索: ${safeTitle} - LibreTV`;
        } catch (e) {
            console.error('更新浏览器历史失败:', e);
        }

        if (window.innerWidth <= 768) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }
}

// 渲染电影/电视剧切换器
function renderDoubanMovieTvSwitch() {
    // 获取切换按钮元素
    const movieToggle = document.getElementById('douban-movie-toggle');
    const tvToggle = document.getElementById('douban-tv-toggle');

    if (!movieToggle || !tvToggle) return;

    movieToggle.addEventListener('click', function () {
        if (doubanMovieTvCurrentSwitch !== 'movie') {
            // 更新按钮样式
            movieToggle.classList.add('bg-pink-600', 'text-white');
            movieToggle.classList.remove('text-gray-300');

            tvToggle.classList.remove('bg-pink-600', 'text-white');
            tvToggle.classList.add('text-gray-300');

            doubanMovieTvCurrentSwitch = 'movie';
            doubanCurrentTag = '热门';

            // 重新加载豆瓣内容
            renderDoubanTags(movieTags);

            // 换一批按钮事件监听
            setupDoubanRefreshBtn();

            // 初始加载热门内容
            if (localStorage.getItem('doubanEnabled') === 'true') {
                renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
            }
        }
    });

    // 电视剧按钮点击事件
    tvToggle.addEventListener('click', function () {
        if (doubanMovieTvCurrentSwitch !== 'tv') {
            // 更新按钮样式
            tvToggle.classList.add('bg-pink-600', 'text-white');
            tvToggle.classList.remove('text-gray-300');

            movieToggle.classList.remove('bg-pink-600', 'text-white');
            movieToggle.classList.add('text-gray-300');

            doubanMovieTvCurrentSwitch = 'tv';
            doubanCurrentTag = '热门';

            // 重新加载豆瓣内容
            renderDoubanTags(tvTags);

            // 换一批按钮事件监听
            setupDoubanRefreshBtn();

            // 初始加载热门内容
            if (localStorage.getItem('doubanEnabled') === 'true') {
                renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
            }
        }
    });
}

// 渲染豆瓣标签选择器
function renderDoubanTags(tags) {
    const tagContainer = document.getElementById('douban-tags');
    if (!tagContainer) return;

    // 确定当前应该使用的标签列表
    const currentTags = doubanMovieTvCurrentSwitch === 'movie' ? movieTags : tvTags;

    // 清空标签容器
    tagContainer.innerHTML = '';

    // 先添加标签管理按钮
    const manageBtn = document.createElement('button');
    manageBtn.className = 'py-1.5 px-3.5 rounded text-sm font-medium transition-all duration-300 bg-[#1a1a1a] text-gray-300 hover:bg-pink-700 hover:text-white border border-[#333] hover:border-white';
    manageBtn.innerHTML = '<span class="flex items-center"><svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>管理标签</span>';
    manageBtn.onclick = function () {
        showTagManageModal();
    };
    tagContainer.appendChild(manageBtn);

    // 添加所有标签
    currentTags.forEach(tag => {
        const btn = document.createElement('button');

        // 设置样式
        let btnClass = 'py-1.5 px-3.5 rounded text-sm font-medium transition-all duration-300 border ';

        // 当前选中的标签使用高亮样式
        if (tag === doubanCurrentTag) {
            btnClass += 'bg-pink-600 text-white shadow-md border-white';
        } else {
            btnClass += 'bg-[#1a1a1a] text-gray-300 hover:bg-pink-700 hover:text-white border-[#333] hover:border-white';
        }

        btn.className = btnClass;
        btn.textContent = tag;

        btn.onclick = function () {
            if (doubanCurrentTag !== tag) {
                doubanCurrentTag = tag;
                doubanPageStart = 0;
                renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
                renderDoubanTags();
            }
        };

        tagContainer.appendChild(btn);
    });
}

// 设置换一批按钮事件
function setupDoubanRefreshBtn() {
    // 修复ID，使用正确的ID douban-refresh 而不是 douban-refresh-btn
    const btn = document.getElementById('douban-refresh');
    if (!btn) return;

    btn.onclick = function () {
        doubanPageStart += doubanPageSize;
        if (doubanPageStart > 9 * doubanPageSize) {
            doubanPageStart = 0;
        }

        renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
    };
}

function fetchDoubanTags() {
    const movieTagsTarget = `https://movie.douban.com/j/search_tags?type=movie`
    fetchDoubanData(movieTagsTarget)
        .then(data => {
            movieTags = data.tags;
            if (doubanMovieTvCurrentSwitch === 'movie') {
                renderDoubanTags(movieTags);
            }
        })
        .catch(error => {
            console.error("获取豆瓣热门电影标签失败：", error);
        });
    const tvTagsTarget = `https://movie.douban.com/j/search_tags?type=tv`
    fetchDoubanData(tvTagsTarget)
        .then(data => {
            tvTags = data.tags;
            if (doubanMovieTvCurrentSwitch === 'tv') {
                renderDoubanTags(tvTags);
            }
        })
        .catch(error => {
            console.error("获取豆瓣热门电视剧标签失败：", error);
        });
}

// 渲染热门推荐内容
function renderRecommend(tag, pageLimit, pageStart) {
    const container = document.getElementById("douban-results");
    if (!container) return;

    const loadingOverlayHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div class="flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                <span class="text-pink-500 ml-4">加载中...</span>
            </div>
        </div>
    `;

    container.classList.add("relative");
    container.insertAdjacentHTML('beforeend', loadingOverlayHTML);

    const target = `https://movie.douban.com/j/search_subjects?type=${doubanMovieTvCurrentSwitch}&tag=${tag}&sort=recommend&page_limit=${pageLimit}&page_start=${pageStart}`;

    // 使用通用请求函数
    fetchDoubanData(target)
        .then(data => {
            renderDoubanCards(data, container);
        })
        .catch(error => {
            console.error("获取豆瓣数据失败：", error);
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-red-400">❌ 获取豆瓣数据失败，请稍后重试</div>
                    <div class="text-gray-500 text-sm mt-2">提示：使用VPN可能有助于解决此问题</div>
                </div>
            `;
        });
}

async function fetchDoubanData(url) {
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    // 设置请求选项，包括信号和头部
    const fetchOptions = {
        signal: controller.signal,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Referer': 'https://movie.douban.com/',
            'Accept': 'application/json, text/plain, */*',
        }
    };

    try {
        // 添加鉴权参数到代理URL
        const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ? 
            await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(url)) :
            PROXY_URL + encodeURIComponent(url);
            
        // 尝试直接访问（豆瓣API可能允许部分CORS请求）
        const response = await fetch(proxiedUrl, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("豆瓣 API 请求失败（直接代理）：", err);

        // 失败后尝试备用方法：作为备选
        const fallbackUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

        try {
            const fallbackResponse = await fetch(fallbackUrl);

            if (!fallbackResponse.ok) {
                throw new Error(`备用API请求失败! 状态: ${fallbackResponse.status}`);
            }

            const data = await fallbackResponse.json();

            // 解析原始内容
            if (data && data.contents) {
                return JSON.parse(data.contents);
            } else {
                throw new Error("无法获取有效数据");
            }
        } catch (fallbackErr) {
            console.error("豆瓣 API 备用请求也失败：", fallbackErr);
            throw fallbackErr; // 向上抛出错误，让调用者处理
        }
    }
}

// 抽取渲染豆瓣卡片的逻辑到单独函数
function renderDoubanCards(data, container) {
    // 创建文档片段以提高性能
    const fragment = document.createDocumentFragment();

    // 如果没有数据
    if (!data.subjects || data.subjects.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "col-span-full text-center py-8";
        emptyEl.innerHTML = `
            <div class="text-pink-500">❌ 暂无数据，请尝试其他分类或刷新</div>
        `;
        fragment.appendChild(emptyEl);
    } else {
        // 循环创建每个影视卡片
        data.subjects.forEach(item => {
            const card = document.createElement("div");
            card.className = "bg-[#111] hover:bg-[#222] transition-all duration-300 rounded-lg overflow-hidden flex flex-col transform hover:scale-105 shadow-md hover:shadow-lg";

            // 生成卡片内容，确保安全显示（防止XSS）
            const safeTitle = item.title
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');

            const safeRate = (item.rate || "暂无")
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // 处理图片URL
            // 1. 直接使用豆瓣图片URL (添加no-referrer属性)
            const originalCoverUrl = item.cover;

            // 2. 也准备代理URL作为备选
            const proxiedCoverUrl = PROXY_URL + encodeURIComponent(originalCoverUrl) + '?image-version=2';

            // 为不同设备优化卡片布局
            card.innerHTML = `
                <div class="relative w-full aspect-[2/3] overflow-hidden cursor-pointer" onclick="fillAndSearchWithDouban('${safeTitle}')">
                    <img src="${proxiedCoverUrl}" alt="${safeTitle}"
                        class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy" referrerpolicy="no-referrer">
                    <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                    <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-sm">
                        <span class="text-yellow-400">★</span> ${safeRate}
                    </div>
                    <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-sm hover:bg-[#333] transition-colors">
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" title="在豆瓣查看" onclick="event.stopPropagation();">
                            🔗
                        </a>
                    </div>
                </div>
                <div class="p-2 text-center bg-[#111]">
                    <button onclick="fillAndSearchWithDouban('${safeTitle}')" 
                            class="text-sm font-medium text-white truncate w-full hover:text-pink-400 transition"
                            title="${safeTitle}">
                        ${safeTitle}
                    </button>
                </div>
            `;

            fragment.appendChild(card);
        });
    }

    // 清空并添加所有新元素
    container.innerHTML = "";
    container.appendChild(fragment);
}

// 重置到首页
function resetToHome() {
    resetSearchArea();
    updateDoubanVisibility();
}

// 加载豆瓣首页内容
document.addEventListener('DOMContentLoaded', initDouban);

// 显示标签管理模态框
function showTagManageModal() {
    // 确保模态框在页面上只有一个实例
    let modal = document.getElementById('tagManageModal');
    if (modal) {
        document.body.removeChild(modal);
    }

    // 创建模态框元素
    modal = document.createElement('div');
    modal.id = 'tagManageModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40';

    // 当前使用的标签类型和默认标签
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';
    const currentTags = isMovie ? movieTags : tvTags;
    const defaultTags = isMovie ? defaultMovieTags : defaultTvTags;

    // 模态框内容
    modal.innerHTML = `
        <div class="bg-[#191919] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button id="closeTagModal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
            
            <h3 class="text-xl font-bold text-white mb-4">标签管理 (${isMovie ? '电影' : '电视剧'})</h3>
            
            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-lg font-medium text-gray-300">标签列表</h4>
                    <button id="resetTagsBtn" class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">
                        恢复默认标签
                    </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4" id="tagsGrid">
                    ${currentTags.length ? currentTags.map(tag => {
        // "热门"标签不能删除
        const canDelete = tag !== '热门';
        return `
                            <div class="bg-[#1a1a1a] text-gray-300 py-1.5 px-3 rounded text-sm font-medium flex justify-between items-center group">
                                <span>${tag}</span>
                                ${canDelete ?
                `<button class="delete-tag-btn text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                                        data-tag="${tag}">✕</button>` :
                `<span class="text-gray-500 text-xs italic opacity-0 group-hover:opacity-100">必需</span>`
            }
                            </div>
                        `;
    }).join('') :
            `<div class="col-span-full text-center py-4 text-gray-500">无标签，请添加或恢复默认</div>`}
                </div>
            </div>
            
            <div class="border-t border-gray-700 pt-4">
                <h4 class="text-lg font-medium text-gray-300 mb-3">添加新标签</h4>
                <form id="addTagForm" class="flex items-center">
                    <input type="text" id="newTagInput" placeholder="输入标签名称..." 
                           class="flex-1 bg-[#222] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-pink-500">
                    <button type="submit" class="ml-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded">添加</button>
                </form>
                <p class="text-xs text-gray-500 mt-2">提示：标签名称不能为空，不能重复，不能包含特殊字符</p>
            </div>
        </div>
    `;

    // 添加模态框到页面
    document.body.appendChild(modal);

    // 焦点放在输入框上
    setTimeout(() => {
        document.getElementById('newTagInput').focus();
    }, 100);

    // 添加事件监听器 - 关闭按钮
    document.getElementById('closeTagModal').addEventListener('click', function () {
        document.body.removeChild(modal);
    });

    // 添加事件监听器 - 点击模态框外部关闭
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // 添加事件监听器 - 恢复默认标签按钮
    document.getElementById('resetTagsBtn').addEventListener('click', function () {
        resetTagsToDefault();
        showTagManageModal(); // 重新加载模态框
    });

    // 添加事件监听器 - 删除标签按钮
    const deleteButtons = document.querySelectorAll('.delete-tag-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const tagToDelete = this.getAttribute('data-tag');
            deleteTag(tagToDelete);
            showTagManageModal(); // 重新加载模态框
        });
    });

    // 添加事件监听器 - 表单提交
    document.getElementById('addTagForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const input = document.getElementById('newTagInput');
        const newTag = input.value.trim();

        if (newTag) {
            addTag(newTag);
            input.value = '';
            showTagManageModal(); // 重新加载模态框
        }
    });
}

// 添加标签
function addTag(tag) {
    // 安全处理标签名，防止XSS
    const safeTag = tag
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // 确定当前使用的是电影还是电视剧标签
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';
    const currentTags = isMovie ? movieTags : tvTags;

    // 检查是否已存在（忽略大小写）
    const exists = currentTags.some(
        existingTag => existingTag.toLowerCase() === safeTag.toLowerCase()
    );

    if (exists) {
        showToast('标签已存在', 'warning');
        return;
    }

    // 添加到对应的标签数组
    if (isMovie) {
        movieTags.push(safeTag);
    } else {
        tvTags.push(safeTag);
    }

    // 保存到本地存储
    saveUserTags();

    // 重新渲染标签
    renderDoubanTags();

    showToast('标签添加成功', 'success');
}

// 删除标签
function deleteTag(tag) {
    // 热门标签不能删除
    if (tag === '热门') {
        showToast('热门标签不能删除', 'warning');
        return;
    }

    // 确定当前使用的是电影还是电视剧标签
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';
    const currentTags = isMovie ? movieTags : tvTags;

    // 寻找标签索引
    const index = currentTags.indexOf(tag);

    // 如果找到标签，则删除
    if (index !== -1) {
        currentTags.splice(index, 1);

        // 保存到本地存储
        saveUserTags();

        // 如果当前选中的是被删除的标签，则重置为"热门"
        if (doubanCurrentTag === tag) {
            doubanCurrentTag = '热门';
            doubanPageStart = 0;
            renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
        }

        // 重新渲染标签
        renderDoubanTags();

        showToast('标签删除成功', 'success');
    }
}

// 重置为默认标签
function resetTagsToDefault() {
    // 确定当前使用的是电影还是电视剧
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';

    // 重置为默认标签
    if (isMovie) {
        movieTags = [...defaultMovieTags];
    } else {
        tvTags = [...defaultTvTags];
    }

    // 设置当前标签为热门
    doubanCurrentTag = '热门';
    doubanPageStart = 0;

    // 保存到本地存储
    saveUserTags();

    // 重新渲染标签和内容
    renderDoubanTags();
    renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);

    showToast('已恢复默认标签', 'success');
}
