// ==UserScript==
// @name         Cambridge Dictionary Structured Panel (Boxed)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  剑桥词典结构化显示（方框风格，B2等级词义旁显示，去重复例句）
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      dictionary.cambridge.org
// ==/UserScript==

(function() {
    'use strict';

    console.log('剑桥词典结构化脚本加载成功');

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

        console.log('剑桥词典脚本初始化完成（面板绑定）');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;
        isSearching = true;
        console.log('开始搜索:', query);
        searchCambridge(query);
    }

    function searchCambridge(query) {
        updatePanelContent(`<div class="loading" style="text-align:center; padding:20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
            正在查询剑桥词典...<br><small>搜索词: "${escapeHtml(query)}"</small>
        </div>`);

        const url = `https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/${encodeURIComponent(query.toLowerCase())}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else if (response.status === 404) showResult('未找到', `在剑桥词典中未找到单词 "${query}"`, 'error');
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() { isSearching = false; showResult('网络错误', '无法连接到剑桥词典', 'error'); },
            ontimeout: function() { isSearching = false; showResult('请求超时', '连接剑桥词典超时', 'error'); }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const notFound = doc.querySelector('.empty-message, [data-title="无此词条"]');
            if (notFound) return showResult('未找到', `在剑桥词典中未找到单词 "${query}"`, 'error');
            const content = extractContent(doc, query);
            if (content) updatePanelContent(content);
            else showResult('解析失败', '无法解析剑桥词典页面内容，页面结构可能已更新', 'error');
        } catch (err) {
            console.error('解析错误:', err);
            showResult('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
        }
    }

    function extractContent(doc, query) {
        // 外部方框
        let content = `<div style="font-family:Segoe UI, sans-serif; color:#212529; background:#ffffff; padding:20px; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;

        // 单词 / 发音 / 词性
        const word = doc.querySelector('h1.hw, .headword')?.textContent.trim() || query;
        const pron = doc.querySelector('.pron.dpron, .dpron')?.textContent.trim() || '';
        const pos = doc.querySelector('.pos.dpos, .dpos')?.textContent.trim() || '';
        content += `<h1 style="margin-bottom:5px;">${escapeHtml(word)}</h1>`;
        if(pos) content += `<div style="display:inline-block; font-weight:bold; margin-bottom:10px;">${escapeHtml(pos)}</div>`;
        if(pron) content += `<div style="margin-bottom:15px; color:#6c757d;">${escapeHtml(pron)}</div>`;

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
            content += `<strong>${seq}. ${escapeHtml(defText)}</strong> ${level ? escapeHtml(level) : ''}<br>`;

            // 例句去重
            const examples = defBlock.querySelectorAll('.examp .eg');
            examples.forEach(ex => {
                const text = ex.textContent.trim();
                if(text && !seenSentences.has(text)) {
                    content += `<div style="margin-left:20px; margin-top:5px; font-style:italic; color:#495057;">${escapeHtml(text)}</div>`;
                    seenSentences.add(text);
                }
            });

            content += `</div>`;
            seq++;
        });

        content += addFooter();
        content += `</div>`; // 外部方框结束
        return content;
    }

    function addFooter() {
        return `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #e9ecef; color:#6c757d; font-size:0.8rem;">
            <i class="fas fa-database"></i> 数据来源: 剑桥词典 (Cambridge Dictionary)<br>
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
