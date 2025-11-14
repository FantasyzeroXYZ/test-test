// ==UserScript==
// @name         dict_asia(zh-ja)词典
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  获取词典内容并在底部面板显示
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      dict.asia
// ==/UserScript==

(function() {
    'use strict';

    console.log('🌏 dict.asia 精准结构化脚本加载成功');

    let isSearching = false;
    setTimeout(initialize, 1500);

    function initialize() {
        if (typeof panelSearchBtn === 'undefined' || typeof panelSearchInput === 'undefined' || typeof panelTampermonkeyResult === 'undefined') {
            console.log('⏳ 未检测到底部面板元素，3秒后重试...');
            setTimeout(initialize, 3000);
            return;
        }

        panelSearchBtn.addEventListener('click', handleSearch);
        panelSearchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleSearch();
        });

        console.log('✅ dict.asia 脚本初始化完成');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;

        isSearching = true;
        console.log('🔍 查询:', query);
        searchAsiaDict(query);
    }

    function searchAsiaDict(query) {
        updatePanelContent(`
            <div style="text-align:center; padding:20px;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
                正在查询 dict.asia ...<br>
                <small>搜索词: "${escapeHtml(query)}"</small>
            </div>
        `);

        const url = `https://dict.asia/jc/${encodeURIComponent(query)}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
            onload: function(response) {
                isSearching = false;
                if (response.status === 200) processResponse(response.responseText, query);
                else showResult('请求失败', `HTTP错误: ${response.status}`, 'error');
            },
            onerror: function() {
                isSearching = false;
                showResult('网络错误', '无法连接到 dict.asia', 'error');
            },
            ontimeout: function() {
                isSearching = false;
                showResult('请求超时', '连接 dict.asia 超时', 'error');
            }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const jpComment = doc.querySelector('#jp_comment');
            if (!jpComment) {
                return showResult('未找到', `在 dict.asia 中未找到单词 "${query}"`, 'error');
            }

            const content = extractContent(jpComment);
            updatePanelContent(content);
        } catch (err) {
            console.error('解析错误:', err);
            showResult('解析错误', err.message, 'error');
        }
    }

    function extractContent(root) {
        // 外部背景容器
        let html = `<div style="
            font-family:Segoe UI, sans-serif;
            color:#212529;
            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
            padding:20px;
            border-radius:12px;
            box-shadow:0 4px 12px rgba(0,0,0,0.1);
        ">`;

        // === 标题 ===
        const word = root.querySelector('.jpword')?.textContent.trim() || '';
        const kana = root.querySelector('#kana_0')?.textContent.trim() || '';
        const roma = root.querySelector('.trs_jp.bold[title="罗马音"]')?.textContent.trim() || '';
        const tone = root.querySelector('.tone_jp')?.textContent.trim() || '';
        const audio = root.querySelector('.jpSound a')?.getAttribute('onclick')?.match(/'(https?:[^']+\.mp3)'/)?.[1];

        html += `
            <div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:15px;">
                <h2 style="color:#2575fc; margin-bottom:6px;"><i class="fas fa-book"></i> ${escapeHtml(word)}</h2>
                <div style="color:#495057;">
                    ${kana ? `<span style="margin-right:8px;">${escapeHtml(kana)}</span>` : ''}
                    ${roma ? `<span style="margin-right:8px;">${escapeHtml(roma)}</span>` : ''}
                    ${tone ? `<span style="background:#e7f1ff; padding:2px 6px; border-radius:4px;">${escapeHtml(tone)}</span>` : ''}
                    ${audio ? `<a href="${audio}" target="_blank" style="margin-left:10px; color:#2575fc;"><i class="fas fa-volume-up"></i> 发音</a>` : ''}
                </div>
            </div>
        `;

        // === 释义 ===
        const explain = root.querySelector('.jp_explain, #jp_com_panel_0');
        if (explain) {
            const type = explain.querySelector('.wordtype')?.textContent.trim() || '';
            const comment = explain.textContent.replace(/\s+/g, ' ').trim();

            html += `<h3 style="color:#495057;"><i class="fas fa-list"></i> 释义</h3>`;
            html += `
                <div style="margin-bottom:8px; padding:10px; background:#f8f9fa; border-radius:6px; border-left:4px solid #2575fc;">
                    ${type ? `<div style="font-weight:bold; margin-bottom:5px;">${escapeHtml(type)}</div>` : ''}
                    <div>${escapeHtml(comment.split('。')[0] + '。')}</div>
                </div>
            `;
        }

        // === 例句 ===
        const examples = root.querySelectorAll('p.liju');
        if (examples.length > 0) {
            html += `<h3 style="color:#495057; margin-top:10px;"><i class="fas fa-comment-dots"></i> 例句</h3>`;
            examples.forEach(p => {
                const lines = p.innerHTML.split('<br>').filter(l => l.trim());
                lines.forEach(line => {
                    const clean = line.replace(/<[^>]+>/g, '').trim();
                    if (clean) {
                        html += `
                            <div style="margin-bottom:6px; padding:8px; background:#fff; border:1px solid #e9ecef; border-radius:4px; font-style:italic;">
                                <i class="fas fa-quote-left" style="color:#6c757d;"></i> ${escapeHtml(clean)}
                            </div>
                        `;
                    }
                });
            });
        }

        html += addFooter('dict.asia');
        html += `</div>`; // 结束外部背景容器
        return html;
    }

    function addFooter(source='词典') {
        return `
            <div style="margin-top:20px; padding-top:10px; border-top:1px solid #e9ecef; color:#6c757d; font-size:0.8rem;">
                <i class="fas fa-database"></i> 数据来源: ${source}<br>
                <i class="fas fa-clock"></i> 更新时间: ${new Date().toLocaleString()}
            </div>
        `;
    }

    function updatePanelContent(html) {
        if (panelTampermonkeyResult) panelTampermonkeyResult.innerHTML = html;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showResult(title, message, type = 'info') {
        const color = type === 'error' ? '#dc3545' : '#17a2b8';
        updatePanelContent(`
            <div style="text-align:center; padding:20px; color:${color}">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `);
    }

})();
