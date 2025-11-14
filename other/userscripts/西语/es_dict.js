// ==UserScript==
// @name         西语查询整合版
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
// @connect      englishlib.org
// @connect      www.ohdict.com
// @connect      www.esdict.cn
// ==/UserScript==

(function() {
    'use strict';

    // 默认词典配置
    const DEFAULT_DICTIONARIES = {
        englishlib: {
            name: 'EnglishLib(zh-es)',
            enabled: true,
            order: 1,
            search: function(query) { return this.instance.search(query); }
        },
        ohdict: {
            name: 'OHDict(zh-es)',
            enabled: true,
            order: 2,
            search: function(query) { return this.instance.search(query); }
        },
        esdict: {
            name: 'ESDict(zh-es)',
            enabled: true,
            order: 3,
            search: function(query) { return this.instance.search(query); }
        }
    };

    // 词典基类
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
            return `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #e9ecef; color:#6c757d; font-size:0.8rem;">
                <i class="fas fa-database"></i> 数据来源: ${source}<br>
                <i class="fas fa-clock"></i> 更新时间: ${new Date().toLocaleString()}
            </div>`;
        }

        showLoading(query) {
            return `<div style="text-align:center; padding:20px;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
                正在查询 ${this.name}...<br>
                <small>搜索词: "${this.escapeHtml(query)}"</small>
            </div>`;
        }

        showError(title, message, type = 'info') {
            const color = type === 'error' ? '#dc3545' : '#17a2b8';
            return `<div style="text-align:center; padding:20px; color:${color}">
                <h3>${this.escapeHtml(title)}</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>`;
        }

        getContainerStyle() {
            return `font-family: Segoe UI, sans-serif;
                color: #212529;
                background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                min-height: 300px;`;
        }

        fetchUrl(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
                    timeout: 15000,
                    onload: function(response) {
                        if (response.status === 200) resolve(response.responseText);
                        else reject(new Error(`HTTP错误: ${response.status}`));
                    },
                    onerror: function() { reject(new Error(`无法连接到 ${url.split('/')[2]}`)); },
                    ontimeout: function() { reject(new Error(`连接 ${url.split('/')[2]} 超时`)); }
                });
            });
        }
    }

    // EnglishLib 词典类
    class EnglishLibDict extends Dictionary {
        constructor() {
            super('EnglishLib');
        }

        async search(query) {
            if (this.isSearching) return;
            this.isSearching = true;

            try {
                const url = `https://englishlib.org/cn/dictionary/es-cn/${encodeURIComponent(query)}.html`;
                const html = await this.fetchUrl(url);
                return this.processResponse(html, query);
            } catch (error) {
                return this.showError('查询失败', error.message, 'error');
            } finally {
                this.isSearching = false;
            }
        }

        processResponse(html, query) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const block = doc.querySelector('.block-content-header-content');

                if (!block) {
                    return this.showError('未找到', `在 EnglishLib 中未找到单词 "${query}"`, 'error');
                }

                return this.extractContent(block, query);
            } catch (err) {
                console.error('解析错误:', err);
                return this.showError('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
            }
        }

        extractContent(block, query) {
            let content = `<div style="${this.getContainerStyle()}">`;

            const html = block.innerHTML;

            // 单词
            const wordMatch = html.match(/是\s*"<b>(.*?)<\/b>"/);
            const word = wordMatch ? wordMatch[1].trim() : '';

            // 中文释义：去掉所有 HTML 标签，只取文本
            const meaningMatch = html.match(/(.+?)\s*是\s*"/);
            let meaning = meaningMatch ? meaningMatch[1].trim() : '';
            meaning = meaning.replace(/<[^>]+>/g, '').trim(); // 去掉 HTML 标签

            if(word) content += `<h1 style="margin-bottom:10px;">${this.escapeHtml(word)}</h1>`;
            if(meaning) content += `<div style="margin-bottom:12px; padding:10px; border-left:4px solid #2575fc; background:#f8f9fa; border-radius:6px;">
                <strong>释义: ${this.escapeHtml(meaning)}</strong>
            </div>`;

            // 使用示例
            const exampleMatch = html.match(/使用示例：(.+?)<br>/);
            const example = exampleMatch ? exampleMatch[1].trim() : '';
            if(example) content += `<div style="margin-bottom:12px;">
                <strong>示例句:</strong><br>
                <div style="margin-left:10px; font-style:italic; color:#495057;">${this.escapeHtml(example)}</div>
            </div>`;

            // 同义词
            const synonymMatch = html.match(/可能的同义词：(.+?)<\/p>/);
            const synonym = synonymMatch ? synonymMatch[1].trim().replace(/<[^>]+>/g, '') : '';
            if(synonym) content += `<div style="margin-bottom:12px;">
                <strong>同义词:</strong> ${this.escapeHtml(synonym)}
            </div>`;

            content += this.addFooter('EnglishLib');
            content += `</div>`;
            return content;
        }
    }

    // OHDict 词典类
    class OHDictDict extends Dictionary {
        constructor() {
            super('OHDict');
        }

        async search(query) {
            if (this.isSearching) return;
            this.isSearching = true;

            try {
                const url = `http://www.ohdict.com/translate.php?seekname=${encodeURIComponent(query)}`;
                const html = await this.fetchUrl(url);
                return this.processResponse(html, query);
            } catch (error) {
                return this.showError('查询失败', error.message, 'error');
            } finally {
                this.isSearching = false;
            }
        }

        processResponse(html, query) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const contentDiv = doc.querySelector('#content');

                if (!contentDiv) {
                    return this.showError('未找到', `在 OHDict 中未找到单词 "${query}"`, 'error');
                }

                const content = this.extractContent(contentDiv);
                if (content) return content;
                else return this.showError('未找到', `在 OHDict 中未找到单词 "${query}"`, 'error');
            } catch (err) {
                console.error('解析错误:', err);
                return this.showError('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
            }
        }

        extractContent(contentDiv) {
            let content = `<div style="${this.getContainerStyle()}">`;

            const dicts = contentDiv.querySelectorAll('.dict');
            dicts.forEach(dict => {
                const explains = Array.from(dict.querySelectorAll('.explain')).filter(ex => {
                    const word = ex.querySelector('.vocable')?.textContent.trim();
                    const para = ex.querySelector('p')?.textContent.trim();
                    return word || para; // 有内容才保留
                });
                if (explains.length === 0) return; // 没内容的词典不显示

                const dictName = dict.querySelector('.dictName span')?.textContent.trim() || '未知词典';
                content += `<div style="padding:10px; margin-bottom:12px; border-bottom:2px solid #2575fc;">
                    <strong style="font-size:1.1rem; color:#2575fc;">${this.escapeHtml(dictName)}</strong>
                </div>`;

                explains.forEach(ex => {
                    const word = ex.querySelector('.vocable')?.textContent.trim() || '';
                    const para = ex.querySelector('p')?.innerHTML.trim() || '';
                    content += `<div style="margin-bottom:8px; padding:10px; background:#f8f9fa; border-radius:6px; border-left:4px solid #2575fc;">
                        <strong>${this.escapeHtml(word)}</strong>
                        <div style="margin-left:6px; margin-top:4px;">${para}</div>
                    </div>`;
                });
            });

            content += this.addFooter('OHDict');
            content += `</div>`;
            return content;
        }
    }

    // ESDict 词典类
    class ESDictDict extends Dictionary {
        constructor() {
            super('ESDict');
        }

        async search(query) {
            if (this.isSearching) return;
            this.isSearching = true;

            try {
                const url = `https://www.esdict.cn/dicts/es/${encodeURIComponent(query)}`;
                const html = await this.fetchUrl(url);
                return this.processResponse(html, query);
            } catch (error) {
                return this.showError('查询失败', error.message, 'error');
            } finally {
                this.isSearching = false;
            }
        }

        processResponse(html, query) {
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const content = this.extractContent(doc, query);
                if (content) return content;
                else return this.showError('未找到', `在 ESDict 中未找到单词 "${query}"`, 'error');
            } catch (err) {
                console.error('解析错误:', err);
                return this.showError('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
            }
        }

        extractContent(doc, query) {
            const expFCchild = doc.querySelector('#ExpFCchild');
            if (!expFCchild) return null;

            let content = `<div style="${this.getContainerStyle()} line-height:1.6;">`;

            // 标题
            content += `<div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:15px;">
                <h2 style="color:#2575fc;"><i class="fas fa-book"></i> ${this.escapeHtml(query)}</h2>
            </div>`;

            // 遍历所有释义块
            const caraList = expFCchild.querySelectorAll('.cara');
            const expList = expFCchild.querySelectorAll('.exp');
            const egList = expFCchild.querySelectorAll('.eg');

            for (let i = 0; i < expList.length; i++) {
                const pos = caraList[i]?.textContent.trim() || '';
                const meaning = expList[i]?.innerHTML.trim() || '';
                const example = egList[i]?.innerHTML.trim() || '';

                // 每条义项保持序号样式，分段显示
                content += `<div style="margin-bottom:12px;">
                    ${pos ? `<strong>${this.escapeHtml(pos)}</strong>` : ''}
                    ${meaning}
                </div>`;

                if (example) {
                    content += `<div style="margin-left:20px; color:#495057;">
                        ${example}
                    </div>`;
                }
            }

            content += this.addFooter('ESDict');
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
            this.dictionaries.englishlib.instance = new EnglishLibDict();
            this.dictionaries.ohdict.instance = new OHDictDict();
            this.dictionaries.esdict.instance = new ESDictDict();
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

            console.log('西班牙语多词典查询脚本初始化完成');
        }

        createTabInterface() {
            // 创建标签页容器
            this.tabContainer = document.createElement('div');
            this.tabContainer.id = 'dict-tabs-container';
            this.tabContainer.style.cssText = `margin-bottom: 15px;
                border-bottom: 1px solid #dee2e6;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;`;

            const tabList = document.createElement('ul');
            tabList.id = 'dict-tabs';
            tabList.style.cssText = `display: flex;
                list-style: none;
                padding: 0;
                margin: 0;
                min-width: min-content;
                flex-wrap: nowrap;`;

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
            settingsBtn.style.cssText = `position: absolute;
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
                justify-content: center;`;
            settingsBtn.addEventListener('click', () => this.showSettingsPanel());
            panelTampermonkeyResult.appendChild(settingsBtn);
        }

        async handleSearch() {
            const query = panelSearchInput.value.trim();
            if (!query || this.isSearching) return;

            this.isSearching = true;
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
            this.contentContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#6c757d;">
                <i class="fas fa-exclamation-circle" style="font-size:3rem;"></i><br>
                <h3 style="margin-top:20px;">未选择任何词典</h3>
                <p>请点击右上角的"词典设置"按钮启用至少一个词典</p>
            </div>`;
        }

        createTabAndContent(tabId, contentId, dictName, isActive = false) {
            // 创建标签页
            const tabItem = document.createElement('li');
            tabItem.id = tabId;
            tabItem.style.cssText = `margin-bottom: -1px;
                margin-right: 2px;
                flex-shrink: 0;
                min-width: 60px;`;

            // 提取显示文本（在空间紧张时显示）
            const displayText = this.getDisplayText(dictName);

            const tabButton = document.createElement('button');
            tabButton.innerHTML = `<span class="tab-text">${displayText}</span>`;
            tabButton.title = dictName; // 完整名称作为提示
            tabButton.style.cssText = `padding: 8px 12px;
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
                display: block;`;

            // 响应式样式
            const style = document.createElement('style');
            style.textContent = `@media (max-width: 768px) {
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
                }`;
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
            contentDiv.style.cssText = `display: ${isActive ? 'block' : 'none'};
                padding: 0;`;
            this.contentContainer.appendChild(contentDiv);

            if (isActive) {
                this.activeTab = { tabId, contentId };
            }
        }

        getDisplayText(fullName) {
            // 根据词典名称返回适当的显示文本
            const textMap = {
                'EnglishLib(zh-es)': 'EnglishLib',
                'OHDict(zh-es)': 'OHDict',
                'ESDict(zh-es)': 'ESDict'
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
            modal.style.cssText = `position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;`;

            const modalContent = document.createElement('div');
            modalContent.style.cssText = `background: white;
                padding: 20px;
                border-radius: 8px;
                width: 500px;
                max-width: 90%;
                max-height: 80%;
                overflow-y: auto;`;

            modalContent.innerHTML = `<h3 style="margin-top:0; color:#495057;"><i class="fas fa-sliders-h"></i> 词典设置</h3>
                <div style="margin-bottom:15px; color:#6c757d; font-size:14px;">
                    拖拽排序，勾选启用/禁用词典
                </div>
                <div id="dict-settings-list" style="margin-bottom:20px;"></div>
                <div style="text-align: right;">
                    <button id="dict-settings-cancel" style="margin-right: 10px; padding:8px 16px; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">取消</button>
                    <button id="dict-settings-save" style="padding:8px 16px; background:#2575fc; color:white; border:none; border-radius:4px; cursor:pointer;">保存设置</button>
                </div>`;

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
                item.style.cssText = `display: flex;
                    align-items: center;
                    padding: 12px;
                    margin-bottom: 8px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                    cursor: move;`;
                item.draggable = true;
                item.dataset.key = key;

                item.innerHTML = `<div style="display:flex; align-items:center; flex:1;">
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
                    </div>`;

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