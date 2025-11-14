// ==UserScript==
// @name         Vocabulary.com 面板高对比结构化显示
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  在底部面板获取 Vocabulary.com 词条内容，白底高对比，释义完整显示
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      vocabulary.com
// @connect      www.vocabulary.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('Vocabulary.com 高对比脚本加载成功');

    let isSearching = false;
    setTimeout(initialize, 1500);

    function initialize() {
        const searchBtn = panelSearchBtn;
        const searchInput = panelSearchInput;

        if (!searchBtn || !searchInput) {
            console.log('未找到底部面板搜索元素，3秒后重试...');
            setTimeout(initialize, 3000);
            return;
        }

        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });

        console.log('Vocabulary.com 脚本初始化完成（面板绑定）');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;

        isSearching = true;
        console.log('Vocabulary.com: 开始搜索:', query);
        searchVocabulary(query);
    }

    function searchVocabulary(query) {
        updatePanelContent(`<div class="loading" style="text-align:center; padding:20px; color:#0d6efd;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
            正在查询Vocabulary.com...<br><small>搜索词: "${escapeHtml(query)}"</small>
        </div>`);

        const url = `https://www.vocabulary.com/dictionary/${encodeURIComponent(query.toLowerCase())}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else if (response.status === 404) showResult('未找到', `在Vocabulary.com中未找到 "${query}"`, 'error');
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() { isSearching = false; showResult('网络错误', '无法连接到Vocabulary.com', 'error'); },
            ontimeout: function() { isSearching = false; showResult('请求超时', '连接Vocabulary.com超时', 'error'); }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const notFound = doc.querySelector('.notfound') || doc.querySelector('.no-results') || !doc.querySelector('.word-area');

            if (notFound) {
                showResult('未找到', `在Vocabulary.com中未找到 "${query}"`, 'error');
                return;
            }

            const content = extractContent(doc, query);
            if (content) updatePanelContent(content);
            else showResult('解析失败', '无法解析Vocabulary.com页面内容', 'error');

        } catch (err) {
            console.error('Vocabulary.com解析错误:', err);
            showResult('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
        }
    }

    function extractContent(doc, query) {
        let content = `<div style="font-family:Segoe UI, sans-serif; color:#1a1a1a;">`;

        // 单词标题 + 发音 + 音节
        const wordHeader = doc.querySelector('h1.word')?.textContent.trim() || query;
        const pronunciation = doc.querySelector('.pronunciation')?.textContent.trim() || '';
        const syllables = doc.querySelector('.syllables')?.textContent.trim() || '';

        content += `<div style="border-bottom:2px solid #0d6efd; padding-bottom:15px; margin-bottom:20px;">
            <h2 style="color:#0d6efd; margin-bottom:10px;"><i class="fas fa-book"></i> ${escapeHtml(wordHeader)}</h2>`;

        if (pronunciation) content += `<div style="color:#495057; font-size:1.1rem; margin-bottom:8px;">
            <i class="fas fa-volume-up"></i> ${escapeHtml(pronunciation)}</div>`;
        if (syllables) content += `<div style="color:#495057; font-size:1rem; margin-bottom:10px;">
            <i class="fas fa-divide"></i> ${escapeHtml(syllables)}</div>`;

        content += `</div>`;

        // 短定义
        const shortDef = doc.querySelector('.short')?.textContent.trim();
        if (shortDef) {
            content += `<div style="margin-bottom:20px;">
                <h3 style="color:#343a40; margin-bottom:10px;"><i class="fas fa-star"></i> 简短定义</h3>
                <div style="padding:15px; background:#ffffff !important; border-radius:8px; border-left:5px solid #0d6efd; color:#1a1a1a !important; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <div style="font-size:1.1rem; line-height:1.5;">${escapeHtml(shortDef)}</div>
                </div>
            </div>`;
        }

        // 详细定义
        const defSections = doc.querySelectorAll('.definition, .group');
        if (defSections.length > 0) {
            content += `<h3 style="color:#343a40; margin-bottom:15px;"><i class="fas fa-list-alt"></i> 详细解释</h3>`;
            defSections.forEach((section, idx) => {
                const defText = section.innerText.trim().replace(/\s+/g, ' ');
                if (!defText) return;
                content += `<div style="margin-bottom:15px; padding:15px; background:#ffffff !important; border-radius:8px; border-left:5px solid #0d6efd; color:#1a1a1a !important; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <strong>${idx+1}. ${escapeHtml(defText)}</strong>
                </div>`;
            });
        }

        // 例句
        const sentences = doc.querySelectorAll('.sentences .example');
        if (sentences.length > 0) {
            content += `<h3 style="color:#343a40; margin-bottom:15px; margin-top:25px;"><i class="fas fa-comments"></i> 例句</h3>`;
            sentences.forEach((sentence, idx) => {
                if (idx >= 5) return;
                content += `<div style="margin-bottom:12px; padding:12px; background:#ffffff !important; border:1px solid #e0e0e0; border-radius:6px; color:#1a1a1a !important; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display:flex; align-items:flex-start; gap:10px;">
                        <span style="background:#0d6efd; color:white; padding:2px 8px; border-radius:4px; font-size:0.8rem;">${idx+1}</span>
                        <div style="line-height:1.5;">${escapeHtml(sentence.textContent.trim())}</div>
                    </div>
                </div>`;
            });
        }

        content += addFooter();
        content += `</div>`;
        return content;
    }

    function addFooter() {
        return `<div style="margin-top:20px; padding:15px; background:#f8f9fa; border-radius:8px; border-left:4px solid #0d6efd; color:#495057; font-size:0.85rem;">
            <i class="fas fa-database"></i> 数据来源: Vocabulary.com<br>
            <i class="fas fa-clock"></i> 更新时间: ${new Date().toLocaleString()}
        </div>`;
    }

    function updatePanelContent(html) {
        if (panelTampermonkeyResult) {
            panelTampermonkeyResult.style.background = '#ffffff';
            panelTampermonkeyResult.style.color = '#1a1a1a';
            panelTampermonkeyResult.innerHTML = html;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showResult(title, message, type='info') {
        const color = type==='error' ? '#dc3545':'#0d6efd';
        updatePanelContent(`<div style="text-align:center; padding:20px; color:${color}">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
        </div>`);
    }

})();
