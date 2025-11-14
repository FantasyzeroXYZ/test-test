// ==UserScript==
// @name         esdict_es_dict
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  获取欧路西语词典内容并在底部面板显示（保留原序号结构化显示）
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      www.esdict.cn
// ==/UserScript==

(function() {
    'use strict';

    let isSearching = false;

    setTimeout(initialize, 1500);

    function initialize() {
        if (!panelSearchBtn || !panelSearchInput) {
            console.log('未找到底部面板搜索元素，3秒后重试...');
            setTimeout(initialize, 3000);
            return;
        }

        panelSearchBtn.addEventListener('click', handleSearch);
        panelSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });

        console.log('ESDict 脚本初始化完成（面板绑定）');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;
        isSearching = true;
        searchEsDict(query);
    }

    function searchEsDict(query) {
        updatePanelContent(`<div style="text-align:center; padding:20px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
            正在查询 ESDict 西语词典...<br>
            <small>搜索词: "${escapeHtml(query)}"</small>
        </div>`);

        const url = `https://www.esdict.cn/dicts/es/${encodeURIComponent(query)}`;
        console.log('请求 URL:', url);

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() { isSearching = false; showResult('网络错误', '无法连接到 ESDict', 'error'); },
            ontimeout: function() { isSearching = false; showResult('请求超时', '连接 ESDict 超时', 'error'); }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const content = extractContent(doc, query);
            if (content) updatePanelContent(content);
            else showResult('未找到', `在 ESDict 中未找到单词 "${query}"`, 'error');
        } catch (err) {
            console.error('解析错误:', err);
            showResult('解析错误', `处理页面内容时出错: ${err.message}`, 'error');
        }
    }

    function extractContent(doc, query) {
        const expFCchild = doc.querySelector('#ExpFCchild');
        if (!expFCchild) return null;

        let content = `<div style="
            font-family:Segoe UI, sans-serif;
            color:#212529;
            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
            padding:20px;
            border-radius:12px;
            box-shadow:0 4px 12px rgba(0,0,0,0.1);
            line-height:1.6;
        ">`;

        // 标题
        content += `<div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:15px;">
            <h2 style="color:#2575fc;"><i class="fas fa-book"></i> ${escapeHtml(query)}</h2>
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
                ${pos ? `<strong>${escapeHtml(pos)}</strong> ` : ''}
                ${meaning}
            </div>`;

            if (example) {
                content += `<div style="margin-left:20px; color:#495057;">
                    ${example}
                </div>`;
            }
        }

        content += addFooter('ESDict');
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
