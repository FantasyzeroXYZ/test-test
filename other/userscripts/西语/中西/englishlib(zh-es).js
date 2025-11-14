// ==UserScript==
// @name         EnglishLib Spanish-Chinese Structured Panel (Boxed)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  EnglishLib 西汉词典结构化显示（方框风格，解析释义、例句、同义词，修正单词/释义对应）
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      englishlib.org
// ==/UserScript==

(function() {
    'use strict';

    console.log('EnglishLib 结构化脚本加载成功');

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

        console.log('EnglishLib 脚本初始化完成（面板绑定）');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;
        isSearching = true;
        console.log('开始搜索:', query);
        searchEnglishLib(query);
    }

    function searchEnglishLib(query) {
        updatePanelContent(`<div class="loading" style="text-align:center; padding:20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
            正在查询 EnglishLib...<br><small>搜索词: "${escapeHtml(query)}"</small>
        </div>`);

        const url = `https://englishlib.org/cn/dictionary/es-cn/${encodeURIComponent(query)}.html`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            timeout: 15000,
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() { isSearching = false; showResult('网络错误', '无法连接到 EnglishLib', 'error'); },
            ontimeout: function() { isSearching = false; showResult('请求超时', '连接 EnglishLib 超时', 'error'); }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const block = doc.querySelector('.block-content-header-content');

            if (!block) return showResult('未找到', `在 EnglishLib 中未找到单词 "${query}"`, 'error');

            const content = extractContent(block);
            updatePanelContent(content);

        } catch (err) {
            console.error('解析错误:', err);
            showResult('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
        }
    }

    function extractContent(block) {
        let content = `<div style="font-family:Segoe UI, sans-serif; color:#212529; background:#ffffff; padding:20px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">`;

        const html = block.innerHTML;

        // 单词
        const wordMatch = html.match(/是\s*"<b>(.*?)<\/b>"/);
        const word = wordMatch ? wordMatch[1].trim() : '';

        // 中文释义：去掉所有 HTML 标签，只取文本
        const meaningMatch = html.match(/(.+?)\s*是\s*"/);
        let meaning = meaningMatch ? meaningMatch[1].trim() : '';
        meaning = meaning.replace(/<[^>]+>/g, '').trim(); // 去掉 HTML 标签

        if(word) content += `<h1 style="margin-bottom:10px;">${escapeHtml(word)}</h1>`;
        if(meaning) content += `<div style="margin-bottom:12px; padding:10px; border-left:4px solid #2575fc; background:#f8f9fa; border-radius:6px;">
        <strong>释义: ${escapeHtml(meaning)}</strong>
    </div>`;

        // 使用示例
        const exampleMatch = html.match(/使用示例：(.+?)<br>/);
        const example = exampleMatch ? exampleMatch[1].trim() : '';
        if(example) content += `<div style="margin-bottom:12px;">
        <strong>示例句:</strong><br>
        <div style="margin-left:10px; font-style:italic; color:#495057;">${escapeHtml(example)}</div>
    </div>`;

        // 同义词
        const synonymMatch = html.match(/可能的同义词：(.+?)<\/p>/);
        const synonym = synonymMatch ? synonymMatch[1].trim().replace(/<[^>]+>/g, '') : '';
        if(synonym) content += `<div style="margin-bottom:12px;">
        <strong>同义词:</strong> ${escapeHtml(synonym)}
    </div>`;

        content += addFooter();
        content += `</div>`; // 外部方框结束
        return content;
    }


    function addFooter() {
        return `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #e9ecef; color:#6c757d; font-size:0.8rem;">
            <i class="fas fa-database"></i> 数据来源: EnglishLib<br>
            <i class="fas fa-clock"></i> 更新时间: ${new Date().toLocaleString()}
        </div>`;
    }

    function updatePanelContent(html) {
        if (panelTampermonkeyResult) panelTampermonkeyResult.innerHTML = html;
    }

    function escapeHtml(text){
        if(!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showResult(title,message,type='info'){
        const color = type==='error' ? '#dc3545':'#17a2b8';
        updatePanelContent(`<div style="text-align:center; padding:20px; color:${color}">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
        </div>`);
    }

})();
