// ==UserScript==
// @name         英语查询整合版
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  多词典查询，可切换标签页和可视化设置
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      dict.cn
// @connect      dict.eudic.net
// @connect      dictionary.cambridge.org
// @connect      urbandictionary.com
// ==/UserScript==

(function() {
    'use strict';

    // 默认词典配置
    const DEFAULT_DICTIONARIES = {
        haici: {
            name: 'haici(zh-en)',
            enabled: true,
            order: 1,
            search: function(query) { return this.instance.search(query); }
        },
        eudic: {
            name: 'oulu(zh-en)',
            enabled: true,
            order: 2,
            search: function(query) { return this.instance.search(query); }
        },
        cambridge: {
            name: 'cambridge(en-en)',
            enabled: true,
            order: 3,
            search: function(query) { return this.instance.search(query); }
        },
        urban: {
            name: 'Urban Dictionary(英-英)',
            enabled: true,
            order: 4,
            search: function(query) { return this.instance.search(query); }
        }
    };

    // 词典类定义
    class Dictionary {
        constructor(name) {
            this.name = name;
            this.isSearching = false;
        }

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        addFooter(source) {
            return `
                <div style="margin-top:20px; padding-top:10px; border-top:1px solid #e9ecef; color:#6c757d; font-size:0.8rem;">
                    <i class="fas fa-database"></i> 数据来源: ${source}<br>
                    <i class="fas fa-clock"></i> 更新时间: ${new Date().toLocaleString()}
                </div>
            `;
        }

        showLoading(query) {
            return `
                <div style="text-align:center; padding:20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
                    正在查询 ${this.name}...<br>
                    <small>搜索词: "${this.escapeHtml(query)}"</small>
                </div>
            `;
        }

        showError(title, message, type = 'info') {
            const color = type === 'error' ? '#dc3545' : '#17a2b8';
            return `
                <div style="text-align:center; padding:20px; color:${color}">
                    <h3>${this.escapeHtml(title)}</h3>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        }

        getContainerStyle() {
            return `
                font-family: Segoe UI, sans-serif;
                color: #212529;
                background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                min-height: 300px;
            `;
        }
    }

    // 海词词典类
    class HaiciDict extends Dictionary {
        constructor() {
            super('海词词典');
        }

        async search(query) {
            if (this.isSearching) return;
            this.isSearching = true;

            try {
                const url = `https://dict.cn/${encodeURIComponent(query)}`;
                const html = await this.fetchUrl(url);
                return this.processResponse(html, query);
            } catch (error) {
                return this.showError('查询失败', error.message, 'error');
            } finally {
                this.isSearching = false;
            }
        }

        fetchUrl(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
                    onload: function(response) {
                        if (response.status === 200) resolve(response.responseText);
                        else reject(new Error(`HTTP错误: ${response.status}`));
                    },
                    onerror: function() { reject(new Error('无法连接到海词词典')); },
                    ontimeout: function() { reject(new Error('连接海词词典超时')); }
                });
            });
        }

        processResponse(html, query) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return this.extractContent(doc, query);
            } catch (err) {
                console.error('解析错误:', err);
                return this.showError('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
            }
        }

        extractContent(doc, query) {
            let content = `<div style="${this.getContainerStyle()}">`;

            // 单词标题
            const word = doc.querySelector('.dict-basic-ul .keyword')?.textContent.trim() || query;
            content += `<div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:15px;">
                <h2 style="color:#2575fc; margin-bottom:5px;"><i class="fas fa-book"></i> ${this.escapeHtml(word)}</h2>
            </div>`;

            // 词义
            const defs = doc.querySelectorAll('.dict-basic-ul li');
            if (defs.length > 0) {
                content += `<h3 style="color:#495057; margin-bottom:10px;"><i class="fas fa-list"></i> 词义</h3>`;
                defs.forEach((li, idx) => {
                    // 克隆节点，删除注释
                    const cloned = li.cloneNode(true);
                    [...cloned.childNodes].filter(n => n.nodeType === Node.COMMENT_NODE).forEach(n => n.remove());
                    // 删除广告
                    cloned.querySelectorAll('ins, script, .adsbygoogle').forEach(a => a.remove());

                    const pos = cloned.querySelector('.pos')?.textContent.trim() || '';
                    const trans = cloned.querySelector('.def')?.textContent.trim() || cloned.textContent.trim();

                    if(trans) {
                        content += `<div style="margin-bottom:8px; padding:10px; background:#f8f9fa; border-radius:6px; border-left:4px solid #2575fc;">
                            <strong>${idx + 1}. ${this.escapeHtml(pos)} ${this.escapeHtml(trans)}</strong>
                        </div>`;
                    }
                });
            }

            content += this.addFooter('海词词典');
            content += `</div>`;
            return content;
        }
    }

    // 欧路词典类
    class EudicDict extends Dictionary {
        constructor() {
            super('欧路词典');
        }

        async search(query) {
            if (this.isSearching) return;
            this.isSearching = true;

            try {
                const url = `https://dict.eudic.net/dicts/en/${encodeURIComponent(query)}`;
                const html = await this.fetchUrl(url);
                return this.processResponse(html, query);
            } catch (error) {
                return this.showError('查询失败', error.message, 'error');
            } finally {
                this.isSearching = false;
            }
        }

        fetchUrl(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
                    onload: function(response) {
                        if (response.status === 200) resolve(response.responseText);
                        else reject(new Error(`HTTP错误: ${response.status}`));
                    },
                    onerror: function() { reject(new Error('无法连接到欧路词典')); },
                    ontimeout: function() { reject(new Error('连接欧路词典超时')); }
                });
            });
        }

        processResponse(html, query) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return this.extractContent(doc, query);
            } catch (err) {
                console.error('解析错误:', err);
                return this.showError('解析错误', err.message, 'error');
            }
        }

        extractContent(doc, query) {
            let content = `<div style="${this.getContainerStyle()}">`;

            // 单词标题
            const word = doc.querySelector('.expHead a')?.textContent.trim() || query;
            content += `<div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:15px;">
                <h2 style="color:#2575fc;"><i class="fas fa-book"></i> ${this.escapeHtml(word)}</h2>
            </div>`;

            // 英汉释义
            const expFCchild = doc.querySelector('#ExpFCchild');
            if (expFCchild) {
                const items = expFCchild.querySelectorAll('ol li');
                if (items.length > 0) {
                    content += `<h3 style="color:#495057; margin-bottom:10px;"><i class="fas fa-list"></i> 英汉释义</h3>`;
                    items.forEach((li, idx) => {
                        const html = li.innerHTML.trim();
                        content += `<div style="margin-bottom:8px; padding:10px; background:#f8f9fa; border-radius:6px; border-left:4px solid #2575fc;">
                            ${idx + 1}. ${html}
                        </div>`;
                    });
                }
            }

            content += this.addFooter('欧路词典');
            content += `</div>`;
            return content;
        }
    }

    // 剑桥词典类
    class CambridgeDict extends Dictionary {
        constructor() {
            super('剑桥词典');
        }

        async search(query) {
            if (this.isSearching) return;
            this.isSearching = true;

            try {
                const url = `https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/${encodeURIComponent(query.toLowerCase())}`;
                const html = await this.fetchUrl(url);
                return this.processResponse(html, query);
            } catch (error) {
                return this.showError('查询失败', error.message, 'error');
            } finally {
                this.isSearching = false;
            }
        }

        fetchUrl(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
                    onload: function(response) {
                        if (response.status === 200) resolve(response.responseText);
                        else reject(new Error(`HTTP错误: ${response.status}`));
                    },
                    onerror: function() { reject(new Error('无法连接到剑桥词典')); },
                    ontimeout: function() { reject(new Error('连接剑桥词典超时')); }
                });
            });
        }

        processResponse(html, query) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const notFound = doc.querySelector('.empty-message, [data-title="无此词条"]');
                if (notFound) {
                    return this.showError('未找到', `在剑桥词典中未找到单词 "${query}"`, 'error');
                }
                return this.extractContent(doc, query);
            } catch (err) {
                console.error('解析错误:', err);
                return this.showError('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
            }
        }

        extractContent(doc, query) {
            let content = `<div style="${this.getContainerStyle()}">`;

            // 单词 / 发音 / 词性
            const word = doc.querySelector('h1.hw, .headword')?.textContent.trim() || query;
            const pron = doc.querySelector('.pron.dpron, .dpron')?.textContent.trim() || '';
            const pos = doc.querySelector('.pos.dpos, .dpos')?.textContent.trim() || '';
            content += `<h2 style="color:#2575fc; margin-bottom:5px;">${this.escapeHtml(word)}</h2>`;
            if(pos) content += `<div style="display:inline-block; font-weight:bold; margin-bottom:10px;">${this.escapeHtml(pos)}</div>`;
            if(pron) content += `<div style="margin-bottom:15px; color:#6c757d;">${this.escapeHtml(pron)}</div>`;

            // 词义 + B2等级
            const defs = doc.querySelectorAll('.def-block');
            let seq = 1;
            let seenSentences = new Set();
            defs.forEach(defBlock => {
                const levelElem = defBlock.querySelector('.dlevel');
                const level = levelElem ? levelElem.textContent.trim() : '';
                const defElem = defBlock.querySelector('.def');
                if(!defElem) return;
                const defText = defElem.textContent.trim();
                if(!defText) return;

                content += `<div style="margin-bottom:12px; padding:12px; border:1px solid #e9ecef; border-radius:6px; background:#f8f9fa;">`;
                content += `<strong>${seq}. ${this.escapeHtml(defText)}</strong> ${level ? this.escapeHtml(level) : ''}<br>`;

                // 例句去重
                const examples = defBlock.querySelectorAll('.examp .eg');
                examples.forEach(ex => {
                    const text = ex.textContent.trim();
                    if(text && !seenSentences.has(text)) {
                        content += `<div style="margin-left:20px; margin-top:5px; font-style:italic; color:#495057;">${this.escapeHtml(text)}</div>`;
                        seenSentences.add(text);
                    }
                });

                content += `</div>`;
                seq++;
            });

            content += this.addFooter('剑桥词典');
            content += `</div>`;
            return content;
        }
    }

    // Urban Dictionary类
    class UrbanDict extends Dictionary {
        constructor() {
            super('Urban Dictionary');
        }

        async search(query) {
            if (this.isSearching) return;
            this.isSearching = true;

            try {
                const url = `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(query)}`;
                const html = await this.fetchUrl(url);
                return this.processResponse(html, query);
            } catch (error) {
                return this.showError('查询失败', error.message, 'error');
            } finally {
                this.isSearching = false;
            }
        }

        fetchUrl(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
                    onload: function(response) {
                        if (response.status === 200) resolve(response.responseText);
                        else reject(new Error(`HTTP错误: ${response.status}`));
                    },
                    onerror: function() { reject(new Error('无法连接到Urban Dictionary')); },
                    ontimeout: function() { reject(new Error('连接Urban Dictionary超时')); }
                });
            });
        }

        processResponse(html, query) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');

                // 检查是否未找到
                if (html.includes("There aren't any definitions for") || html.includes("No results found for")) {
                    return this.showError('未找到', `在Urban Dictionary中未找到单词 "${query}"`, 'error');
                }

                return this.extractContent(doc, query);
            } catch (err) {
                console.error('解析错误:', err);
                return this.showError('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
            }
        }

        extractContent(doc, query) {
            let content = `<div style="${this.getContainerStyle()}">`;

            // 获取定义面板
            const defsAll = doc.querySelectorAll('[data-defid]');
            // 过滤掉广告或无内容的节点
            const defs = Array.from(defsAll).filter(def => {
                const word = def.querySelector('.word')?.textContent.trim();
                const meaning = def.querySelector('.meaning')?.textContent.trim();
                return word && meaning;
            });

            if (defs.length === 0) return null;

            content += `<div style="border-bottom:2px solid #ff6b6b; padding-bottom:10px; margin-bottom:15px;">
                <h2 style="color:#ff6b6b;"><i class="fas fa-theater-masks"></i> Urban Dictionary: ${this.escapeHtml(query)}</h2>
                <div style="color:#6c757d;">找到 ${defs.length} 个有效定义</div>
            </div>`;

            defs.slice(0, 5).forEach((def, idx) => {
                const word = def.querySelector('.word')?.textContent.trim() || query;
                const meaning = def.querySelector('.meaning')?.textContent.trim() || '';
                const example = def.querySelector('.example')?.textContent.trim() || '';
                const upvotes = def.querySelector('.up .count')?.textContent.trim() || '0';
                const downvotes = def.querySelector('.down .count')?.textContent.trim() || '0';
                const contributor = def.querySelector('.contributor')?.textContent.replace('by','').trim() || 'Unknown';

                content += `<div style="margin-bottom:20px; padding:15px; background:#f8f9fa; border-radius:8px; border-left:4px solid #ff6b6b;">
                    <h3 style="margin:0; color:#495057;">${idx+1}. ${this.escapeHtml(word)}</h3>
                    <div style="margin:8px 0; padding:10px; background:#ffffff; border-radius:4px; line-height:1.5;">${this.escapeHtml(meaning)}</div>
                    ${example ? `<div style="margin-top:6px; padding:8px; background:#fff3cd; border-radius:4px; font-style:italic; color:#856404;">
                        <i class="fas fa-quote-left"></i> ${this.escapeHtml(example)}
                    </div>` : ''}
                    <div style="margin-top:6px; font-size:0.8rem; color:#6c757d;">
                        👍 ${this.escapeHtml(upvotes)} &nbsp; 👎 ${this.escapeHtml(downvotes)} &nbsp; 贡献者: ${this.escapeHtml(contributor)}
                    </div>
                </div>`;
            });

            content += this.addFooter('Urban Dictionary');
            content += `</div>`;
            return content;
        }
    }

    // 词典管理器
    class DictionaryManager {
        constructor() {
            this.tabContainer = null;
            this.contentContainer = null;
            this.activeTab = null;
            this.isSearching = false;
            this.dictionaries = this.loadSettings();

            // 初始化词典实例
            this.initializeDictionaryInstances();
        }

        loadSettings() {
            const saved = GM_getValue('dictionarySettings');
            if (saved) {
                // 合并保存的设置和默认设置
                const merged = {...DEFAULT_DICTIONARIES};
                for (const [key, config] of Object.entries(saved)) {
                    if (merged[key]) {
                        merged[key] = {...merged[key], ...config};
                    }
                }
                return merged;
            }
            return DEFAULT_DICTIONARIES;
        }

        saveSettings() {
            GM_setValue('dictionarySettings', this.dictionaries);
        }

        initializeDictionaryInstances() {
            // 只初始化当前存在的词典类
            this.dictionaries.haici.instance = new HaiciDict();
            this.dictionaries.eudic.instance = new EudicDict();
            this.dictionaries.cambridge.instance = new CambridgeDict();
            this.dictionaries.urban.instance = new UrbanDict();
        }

        initialize() {
            const searchBtn = panelSearchBtn;
            const searchInput = panelSearchInput;

            if (!searchBtn || !searchInput) {
                console.log('未找到底部面板搜索元素，3秒后重试...');
                setTimeout(() => this.initialize(), 3000);
                return;
            }

            this.createTabInterface();
            this.addSettingsButton();

            searchBtn.addEventListener('click', () => this.handleSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });

            console.log('英语词典查询脚本初始化完成');
        }

        createTabInterface() {
            // 创建标签页容器
            this.tabContainer = document.createElement('div');
            this.tabContainer.id = 'dict-tabs-container';
            this.tabContainer.style.cssText = `
                margin-bottom: 15px;
                border-bottom: 1px solid #dee2e6;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            `;

            const tabList = document.createElement('ul');
            tabList.id = 'dict-tabs';
            tabList.style.cssText = `
                display: flex;
                list-style: none;
                padding: 0;
                margin: 0;
                min-width: min-content;
                flex-wrap: nowrap;
            `;

            this.contentContainer = document.createElement('div');
            this.contentContainer.id = 'dict-contents';

            // 清空原有内容并添加新结构
            panelTampermonkeyResult.innerHTML = '';
            panelTampermonkeyResult.appendChild(this.tabContainer);
            panelTampermonkeyResult.appendChild(this.contentContainer);
        }

        addSettingsButton() {
            const settingsBtn = document.createElement('button');
            settingsBtn.innerHTML = '<i class="fas fa-cog"></i>';
            settingsBtn.title = '词典设置';
            settingsBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 8px 10px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                z-index: 1000;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            settingsBtn.addEventListener('click', () => this.showSettingsPanel());
            panelTampermonkeyResult.appendChild(settingsBtn);
        }

        async handleSearch() {
            const query = panelSearchInput.value.trim();
            if (!query || this.isSearching) return;

            this.isSearching = true;
            console.log('开始搜索:', query);
            await this.searchAllDictionaries(query);
            this.isSearching = false;
        }

        async searchAllDictionaries(query) {
            // 清除之前的内容
            this.clearPreviousResults();

            // 获取启用的词典并按顺序排序
            const enabledDicts = Object.entries(this.dictionaries)
                .filter(([key, config]) => config.enabled)
                .sort((a, b) => a[1].order - b[1].order);

            if (enabledDicts.length === 0) {
                this.showNoDictionarySelected();
                return;
            }

            // 创建标签页和内容区域
            enabledDicts.forEach(([key, config], index) => {
                const tabId = `tab-${key}`;
                const contentId = `content-${key}`;
                this.createTabAndContent(tabId, contentId, config.name, index === 0);
                this.updateContent(contentId, config.instance.showLoading(query));
            });

            // 并发查询所有词典
            const promises = enabledDicts.map(async ([key, config]) => {
                const contentId = `content-${key}`;

                try {
                    const content = await config.instance.search(query);
                    this.updateContent(contentId, content);
                    return { key, success: true };
                } catch (error) {
                    console.error(`词典 ${key} 查询失败:`, error);
                    this.updateContent(contentId, config.instance.showError('查询失败', error.message, 'error'));
                    return { key, success: false, error };
                }
            });

            await Promise.allSettled(promises);

            // 激活第一个标签页
            const firstEnabledKey = enabledDicts[0][0];
            this.switchTab(`tab-${firstEnabledKey}`, `content-${firstEnabledKey}`);
        }

        clearPreviousResults() {
            this.tabContainer.innerHTML = '<ul id="dict-tabs" style="display: flex; list-style: none; padding: 0; margin: 0; min-width: min-content; flex-wrap: nowrap;"></ul>';
            this.contentContainer.innerHTML = '';
        }

        showNoDictionarySelected() {
            this.contentContainer.innerHTML = `
                <div style="text-align:center; padding:40px; color:#6c757d;">
                    <i class="fas fa-exclamation-circle" style="font-size:3rem;"></i><br>
                    <h3 style="margin-top:20px;">未选择任何词典</h3>
                    <p>请点击右上角的"词典设置"按钮启用至少一个词典</p>
                </div>
            `;
        }

        createTabAndContent(tabId, contentId, dictName, isActive = false) {
            // 创建标签页
            const tabItem = document.createElement('li');
            tabItem.id = tabId;
            tabItem.style.cssText = `
                margin-bottom: -1px;
                margin-right: 2px;
                flex-shrink: 0;
                min-width: 60px;
            `;

            // 提取显示文本（在空间紧张时显示）
            const displayText = this.getDisplayText(dictName);

            const tabButton = document.createElement('button');
            tabButton.innerHTML = `<span class="tab-text">${displayText}</span>`;
            tabButton.title = dictName; // 完整名称作为提示
            tabButton.style.cssText = `
                padding: 8px 12px;
                border: 1px solid transparent;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                background: ${isActive ? '#fff' : '#f8f9fa'};
                border-color: ${isActive ? '#dee2e6 #dee2e6 #fff' : 'transparent'};
                color: ${isActive ? '#495057' : '#6c757d'};
                cursor: pointer;
                transition: all 0.15s ease;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 120px;
                min-width: 40px;
                font-size: 14px;
                height: 100%;
                display: block;
            `;

            // 响应式样式
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 768px) {
                    #dict-tabs-container {
                        margin-bottom: 10px;
                    }
                    #dict-tabs button {
                        padding: 6px 8px;
                        font-size: 13px;
                        max-width: 80px;
                    }
                }
                @media (max-width: 480px) {
                    #dict-tabs button {
                        padding: 5px 6px;
                        font-size: 12px;
                        max-width: 60px;
                        min-width: 30px;
                    }
                    .tab-text {
                        letter-spacing: -0.5px;
                    }
                }
                @media (max-width: 360px) {
                    #dict-tabs button {
                        padding: 4px 5px;
                        font-size: 11px;
                        max-width: 50px;
                    }
                }

                /* 悬停时显示完整名称 */
                #dict-tabs button:hover .tab-text {
                    overflow: visible;
                    text-overflow: unset;
                    white-space: normal;
                    background: rgba(255,255,255,0.9);
                    padding: 2px 4px;
                    border-radius: 2px;
                    position: relative;
                    z-index: 10;
                }
            `;
            if (!document.head.querySelector('#dict-tabs-responsive')) {
                style.id = 'dict-tabs-responsive';
                document.head.appendChild(style);
            }

            tabButton.addEventListener('click', () => this.switchTab(tabId, contentId));
            tabItem.appendChild(tabButton);
            document.getElementById('dict-tabs').appendChild(tabItem);

            // 创建内容区域
            const contentDiv = document.createElement('div');
            contentDiv.id = contentId;
            contentDiv.style.cssText = `
                display: ${isActive ? 'block' : 'none'};
                padding: 0;
            `;
            this.contentContainer.appendChild(contentDiv);

            if (isActive) {
                this.activeTab = { tabId, contentId };
            }
        }

        getDisplayText(fullName) {
            // 根据词典名称返回适当的显示文本
            const textMap = {
                'haici(zh-en)': 'haici',
                'oulu(zh-en)': 'oulu',
                'cambridge(en-en)': 'cambridge',
                'Urban Dictionary(en-en)': 'Urban',
            };

            return textMap[fullName] || fullName;
        }

        switchTab(tabId, contentId) {
            // 隐藏所有内容
            this.contentContainer.querySelectorAll('div[id^="content-"]').forEach(div => {
                div.style.display = 'none';
            });

            // 重置所有标签样式
            document.querySelectorAll('#dict-tabs button').forEach(button => {
                button.style.background = '#f8f9fa';
                button.style.borderColor = 'transparent';
                button.style.color = '#6c757d';
            });

            // 显示选中内容
            const contentDiv = document.getElementById(contentId);
            if (contentDiv) {
                contentDiv.style.display = 'block';
            }

            // 高亮选中标签
            const activeButton = document.querySelector(`#${tabId} button`);
            if (activeButton) {
                activeButton.style.background = '#fff';
                activeButton.style.borderColor = '#dee2e6 #dee2e6 #fff';
                activeButton.style.color = '#495057';
            }

            this.activeTab = { tabId, contentId };
        }

        updateContent(contentId, html) {
            const contentDiv = document.getElementById(contentId);
            if (contentDiv) {
                contentDiv.innerHTML = html;
            }
        }

        showSettingsPanel() {
            // 创建模态框
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                padding: 20px;
                border-radius: 8px;
                width: 500px;
                max-width: 90%;
                max-height: 80%;
                overflow-y: auto;
            `;

            modalContent.innerHTML = `
                <h3 style="margin-top:0; color:#495057;"><i class="fas fa-sliders-h"></i> 词典设置</h3>
                <div style="margin-bottom:15px; color:#6c757d; font-size:14px;">
                    拖拽排序，勾选启用/禁用词典
                </div>
                <div id="dict-settings-list" style="margin-bottom:20px;"></div>
                <div style="text-align: right;">
                    <button id="dict-settings-cancel" style="margin-right: 10px; padding:8px 16px; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">取消</button>
                    <button id="dict-settings-save" style="padding:8px 16px; background:#2575fc; color:white; border:none; border-radius:4px; cursor:pointer;">保存设置</button>
                </div>
            `;

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            this.populateSettingsList(modalContent);

            // 事件监听
            document.getElementById('dict-settings-cancel').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            document.getElementById('dict-settings-save').addEventListener('click', () => {
                this.saveSettingsFromUI();
                document.body.removeChild(modal);
                // 重新加载设置
                this.dictionaries = this.loadSettings();
                this.initializeDictionaryInstances();
            });
        }

        populateSettingsList(modalContent) {
            const listContainer = document.getElementById('dict-settings-list');
            listContainer.innerHTML = '';

            // 按顺序排序
            const sortedDicts = Object.entries(this.dictionaries)
                .sort((a, b) => a[1].order - b[1].order);

            sortedDicts.forEach(([key, config], index) => {
                const item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    margin-bottom: 8px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                    cursor: move;
                `;
                item.draggable = true;
                item.dataset.key = key;

                item.innerHTML = `
                    <div style="display:flex; align-items:center; flex:1;">
                        <span style="margin-right:12px; color:#6c757d; font-size:14px;">
                            <i class="fas fa-bars"></i>
                        </span>
                        <label style="display:flex; align-items:center; flex:1; cursor:pointer;">
                            <input type="checkbox" ${config.enabled ? 'checked' : ''}
                                style="margin-right:10px;" onchange="event.stopPropagation()">
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:500; color:#212529;">${config.name}</span>
                                <span style="font-size:12px; color:#6c757d; margin-top:2px;">词典ID: ${key}</span>
                            </div>
                        </label>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button class="move-up" style="padding:4px 8px; background:#17a2b8; color:white; border:none; border-radius:3px; cursor:pointer;" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="move-down" style="padding:4px 8px; background:#17a2b8; color:white; border:none; border-radius:3px; cursor:pointer;" ${index === sortedDicts.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                `;

                // 拖拽事件
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', key);
                    item.style.opacity = '0.5';
                });

                item.addEventListener('dragend', () => {
                    item.style.opacity = '1';
                });

                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });

                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const draggedKey = e.dataTransfer.getData('text/plain');
                    this.reorderItems(draggedKey, key);
                });

                // 上下移动按钮事件
                const moveUpBtn = item.querySelector('.move-up');
                const moveDownBtn = item.querySelector('.move-down');

                moveUpBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveItemUp(key);
                });

                moveDownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveItemDown(key);
                });

                listContainer.appendChild(item);
            });
        }

        reorderItems(draggedKey, targetKey) {
            if (draggedKey === targetKey) return;

            const dictEntries = Object.entries(this.dictionaries);
            const draggedIndex = dictEntries.findIndex(([key]) => key === draggedKey);
            const targetIndex = dictEntries.findIndex(([key]) => key === targetKey);

            // 重新排序
            const [draggedItem] = dictEntries.splice(draggedIndex, 1);
            dictEntries.splice(targetIndex, 0, draggedItem);

            // 更新order
            dictEntries.forEach(([key], index) => {
                this.dictionaries[key].order = index + 1;
            });

            this.populateSettingsList(document.querySelector('#dict-settings-list').parentElement);
        }

        moveItemUp(key) {
            const currentOrder = this.dictionaries[key].order;
            if (currentOrder <= 1) return;

            // 找到前一个项目
            const prevKey = Object.keys(this.dictionaries).find(k => this.dictionaries[k].order === currentOrder - 1);
            if (prevKey) {
                this.dictionaries[key].order = currentOrder - 1;
                this.dictionaries[prevKey].order = currentOrder;
                this.populateSettingsList(document.querySelector('#dict-settings-list').parentElement);
            }
        }

        moveItemDown(key) {
            const currentOrder = this.dictionaries[key].order;
            const maxOrder = Math.max(...Object.values(this.dictionaries).map(d => d.order));

            if (currentOrder >= maxOrder) return;

            // 找到后一个项目
            const nextKey = Object.keys(this.dictionaries).find(k => this.dictionaries[k].order === currentOrder + 1);
            if (nextKey) {
                this.dictionaries[key].order = currentOrder + 1;
                this.dictionaries[nextKey].order = currentOrder;
                this.populateSettingsList(document.querySelector('#dict-settings-list').parentElement);
            }
        }

        saveSettingsFromUI() {
            const items = document.querySelectorAll('#dict-settings-list > div');
            items.forEach((item, index) => {
                const key = item.dataset.key;
                const checkbox = item.querySelector('input[type="checkbox"]');

                if (this.dictionaries[key]) {
                    this.dictionaries[key].enabled = checkbox.checked;
                    this.dictionaries[key].order = index + 1;
                }
            });

            this.saveSettings();
        }
    }

    // 初始化脚本
    setTimeout(() => {
        const manager = new DictionaryManager();
        manager.initialize();
    }, 1500);

})();