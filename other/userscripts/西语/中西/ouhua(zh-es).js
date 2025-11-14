// ==UserScript==
// @name         OHDict(zh-es)词典结构化显示
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  获取OHDict词典内容并在底部面板显示，仅显示有内容的词典，每条释义独立方框
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      www.ohdict.com
// ==/UserScript==

(function() {
    'use strict';

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

        console.log('OHDict脚本初始化完成（面板绑定）');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;
        isSearching = true;
        searchOHDict(query);
    }

    function searchOHDict(query) {
        updatePanelContent(`<div style="text-align:center; padding:20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
            正在查询 OHDict...<br><small>搜索词: "${escapeHtml(query)}"</small>
        </div>`);

        const url = `http://www.ohdict.com/translate.php?seekname=${encodeURIComponent(query)}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() { isSearching = false; showResult('网络错误', '无法连接到OHDict', 'error'); },
            ontimeout: function() { isSearching = false; showResult('请求超时', '连接OHDict超时', 'error'); }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const contentDiv = doc.querySelector('#content');
            if (!contentDiv) {
                showResult('未找到', `在 OHDict 中未找到单词 "${query}"`, 'error');
                return;
            }
            const content = extractContent(contentDiv);
            if (content) updatePanelContent(content);
            else showResult('未找到', `在 OHDict 中未找到单词 "${query}"`, 'error');
        } catch (err) {
            console.error('解析错误:', err);
            showResult('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
        }
    }

    function extractContent(contentDiv) {
        // 外部背景容器
        let content = `<div style="
            font-family:Segoe UI, sans-serif;
            color:#212529;
            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
            padding:20px;
            border-radius:12px;
            box-shadow:0 4px 12px rgba(0,0,0,0.1);
        ">`;

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
                <strong style="font-size:1.1rem; color:#2575fc;">${escapeHtml(dictName)}</strong>
            </div>`;

            explains.forEach(ex => {
                const word = ex.querySelector('.vocable')?.textContent.trim() || '';
                const para = ex.querySelector('p')?.innerHTML.trim() || '';
                content += `<div style="margin-bottom:8px; padding:10px; background:#f8f9fa; border-radius:6px; border-left:4px solid #2575fc;">
                    <strong>${escapeHtml(word)}</strong>
                    <div style="margin-left:6px; margin-top:4px;">${para}</div>
                </div>`;
            });
        });

        content += addFooter('OHDict');
        content += `</div>`;
        return content;
    }

    function addFooter(source='词典') {
        return `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #e9ecef; color:#6c757d; font-size:0.8rem;">
            <i class="fas fa-database"></i> 数据来源: ${source}<br>
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
