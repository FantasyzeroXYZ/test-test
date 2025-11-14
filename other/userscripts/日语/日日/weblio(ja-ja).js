// ==UserScript==
// @name         weblio(ja-ja)词典
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  获取词典内容并在底部面板显示，统一外部背景样式
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      weblio.jp
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

        console.log('Weblio.jp 脚本初始化完成（面板绑定）');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;
        isSearching = true;
        searchWeblio(query);
    }

    function searchWeblio(query) {
        updatePanelContent(`<div style="text-align:center; padding:20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
            正在查询 Weblio.jp...<br><small>搜索词: "${escapeHtml(query)}"</small>
        </div>`);

        const url = `https://www.weblio.jp/content/${encodeURIComponent(query)}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() { isSearching = false; showResult('网络错误', '无法连接到 Weblio.jp', 'error'); },
            ontimeout: function() { isSearching = false; showResult('请求超时', '连接 Weblio.jp 超时', 'error'); }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const content = extractContent(doc, query);
            if (content) updatePanelContent(content);
            else showResult('未找到', `在 Weblio.jp 中未找到单词 "${query}"`, 'error');
        } catch (err) {
            console.error('解析错误:', err);
            showResult('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
        }
    }

    function extractContent(doc, query) {
        // 外部背景容器
        let content = `<div style="
            font-family:Segoe UI, sans-serif;
            color:#212529;
            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
            padding:20px;
            border-radius:12px;
            box-shadow:0 4px 12px rgba(0,0,0,0.1);
        ">`;

        // 单词标题
        const word = doc.querySelector('#h1Query')?.textContent.trim() || doc.querySelector('h1')?.textContent.trim() || query;
        content += `<div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:15px;">
            <h2 style="color:#2575fc; margin-bottom:5px;"><i class="fas fa-book"></i> ${escapeHtml(word)}</h2>
        </div>`;

        // 释义
        const defs = doc.querySelectorAll('.kiji, .content-explanation, .description, .level0');
        if (defs.length > 0) {
            content += `<h3 style="color:#495057; margin-bottom:10px;"><i class="fas fa-list"></i> 释义</h3>`;
            defs.forEach((d, idx) => {
                const text = d.textContent.replace(/\s+/g,' ').trim();
                if(text){
                    content += `<div style="margin-bottom:8px; padding:10px; background:#f8f9fa; border-radius:6px; border-left:4px solid #2575fc;">
                        <strong>${idx+1}. ${escapeHtml(text)}</strong>
                    </div>`;
                }
            });
        }

        // 例句
        const examples = doc.querySelectorAll('.Kejje, .exampleSentence, .qotC, .qotE');
        if(examples.length > 0){
            content += `<h3 style="color:#495057; margin-top:10px;"><i class="fas fa-comment-dots"></i> 例句</h3>`;
            examples.forEach((ex, idx)=>{
                const text = ex.textContent.replace(/\s+/g,' ').trim();
                if(text){
                    content += `<div style="margin-bottom:6px; padding:8px; background:#fff; border:1px solid #e9ecef; border-radius:4px; font-style:italic;">
                        <i class="fas fa-quote-left" style="color:#6c757d;"></i> ${escapeHtml(text)}
                    </div>`;
                }
            });
        }

        content += addFooter('Weblio.jp');
        content += `</div>`; // 结束外部背景容器
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
