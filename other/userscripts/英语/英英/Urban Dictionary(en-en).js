// ==UserScript==
// @name         Urban Dictionary (en-en) 面板词典
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  获取Urban Dictionary词典内容并在底部面板显示（带外部背景，过滤广告）
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      urbandictionary.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('Urban Dictionary 面板版脚本加载成功');

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

        console.log('Urban Dictionary 脚本初始化完成（面板绑定）');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;

        isSearching = true;
        console.log('开始搜索:', query);
        searchUrbanDictionary(query);
    }

    function searchUrbanDictionary(query) {
        updatePanelContent(`<div style="text-align:center; padding:20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
            正在查询Urban Dictionary...<br>
            <small>搜索词: "${escapeHtml(query)}"</small>
        </div>`);

        const url = `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(query)}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else if (response.status === 404) showResult('未找到', `在Urban Dictionary中未找到单词 "${query}"`, 'error');
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() { isSearching = false; showResult('网络错误', '无法连接到Urban Dictionary', 'error'); },
            ontimeout: function() { isSearching = false; showResult('请求超时', '连接Urban Dictionary超时', 'error'); }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');

            // 检查是否未找到
            if (html.includes("There aren't any definitions for") || html.includes("No results found for")) {
                return showResult('未找到', `在Urban Dictionary中未找到单词 "${query}"`, 'error');
            }

            const content = extractContent(doc, query);
            if (content) updatePanelContent(content);
            else showResult('解析失败', '无法解析Urban Dictionary页面内容，页面结构可能已更新', 'error');

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

        // 获取定义面板
        const defsAll = doc.querySelectorAll('[data-defid]');
        // 过滤掉广告或无内容的节点
        const defs = Array.from(defsAll).filter(def => {
            const word = def.querySelector('.word')?.textContent.trim();
            const meaning = def.querySelector('.meaning')?.textContent.trim();
            return word && meaning; // 必须有词和释义
        });

        if (defs.length === 0) return null;

        content += `<div style="border-bottom:2px solid #ff6b6b; padding-bottom:10px; margin-bottom:15px;">
            <h2 style="color:#ff6b6b;"><i class="fas fa-theater-masks"></i> Urban Dictionary: ${escapeHtml(query)}</h2>
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
                <h3 style="margin:0; color:#495057;">${idx+1}. ${escapeHtml(word)}</h3>
                <div style="margin:8px 0; padding:10px; background:#ffffff; border-radius:4px; line-height:1.5;">${escapeHtml(meaning)}</div>
                ${example ? `<div style="margin-top:6px; padding:8px; background:#fff3cd; border-radius:4px; font-style:italic; color:#856404;">
                    <i class="fas fa-quote-left"></i> ${escapeHtml(example)}
                </div>` : ''}
                <div style="margin-top:6px; font-size:0.8rem; color:#6c757d;">
                    👍 ${escapeHtml(upvotes)} &nbsp; 👎 ${escapeHtml(downvotes)} &nbsp; 贡献者: ${escapeHtml(contributor)}
                </div>
            </div>`;
        });

        content += addFooter();
        content += `</div>`; // 结束外部背景容器
        return content;
    }

    function addFooter() {
        return `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #dee2e6; color:#6c757d; font-size:0.8rem;">
            <i class="fas fa-database"></i> 数据来源: Urban Dictionary<br>
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
