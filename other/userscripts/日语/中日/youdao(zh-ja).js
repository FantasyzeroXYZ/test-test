// ==UserScript==
// @name         youdao(zh-ja)词典
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  获取词典内容并在底部面板显示
// @author       Assistant
// @match        http://localhost:8080/*
// @match        http://127.0.0.1:8080/*
// @match        https://fantasyzeroxyz.github.io/*
// @grant        GM_xmlhttpRequest
// @connect      youdao.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('🌏 youdao 日语词典脚本加载成功');

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

        console.log('✅ youdao 脚本初始化完成');
    }

    function handleSearch() {
        const query = panelSearchInput.value.trim();
        if (!query || isSearching) return;

        isSearching = true;
        console.log('🔍 查询:', query);
        searchYoudao(query);
    }

    function searchYoudao(query) {
        updatePanelContent(`
            <div style="text-align:center; padding:20px;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><br>
                正在查询有道词典 ...<br>
                <small>搜索词: "${escapeHtml(query)}"</small>
            </div>
        `);

        const url = `https://youdao.com/result?word=${encodeURIComponent(query)}&lang=ja`;

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
                showResult('网络错误', '无法连接到有道', 'error');
            },
            ontimeout: function() {
                isSearching = false;
                showResult('请求超时', '连接有道超时', 'error');
            }
        });
    }

    function processResponse(html, query) {
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');

            // ==== 清理语速/发音元素（针对 ul[data-v-xxx] 模块） ====
            doc.querySelectorAll('ul[data-v-7474c37a]').forEach(ul => {
                if (/语速|发音/.test(ul.textContent)) ul.remove();
            });

            let content = `<div style="
                font-family:Segoe UI, sans-serif;
                color:#212529;
                background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                padding:20px;
                border-radius:12px;
                box-shadow:0 4px 12px rgba(0,0,0,0.1);
            ">`;

            // ==== 获取词和假名 ====
            const wordNode = doc.querySelector('.word-head .title');
            const word = wordNode ? cleanNodeText(wordNode) : query;
            const kanaNode = doc.querySelector('.word-head .pronounce_comp + span');
            const kana = kanaNode ? cleanNodeText(kanaNode) : '';

            // ==== 简明释义 ====
            const simple = doc.querySelector('.simple-explain .each-sense');
            if (simple) {
                content += `<div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:15px;">
                    <h2 style="color:#2575fc;">${escapeHtml(word)}</h2>
                    ${kana ? `<div style="color:#495057;">${escapeHtml(kana)}</div>` : ''}
                </div>`;

                const senses = doc.querySelectorAll('.simple-explain .sense-con .sense-ja');
                if (senses.length > 0) {
                    content += `<h3 style="color:#495057;">释义</h3>`;
                    senses.forEach(s => {
                        content += `<div style="margin-bottom:8px; padding:10px; background:#f8f9fa; border-radius:6px; border-left:4px solid #2575fc;">
                            ${escapeHtml(s.textContent.trim())}
                        </div>`;
                    });
                }
            }

            // ==== 翻译模块（支持多个选项卡） ====
            const { html: translationHtml, found } = getTranslation(doc, word, kana);
            if (found) content += translationHtml;

            // ==== 例句 ====
            const examples = doc.querySelectorAll('#catalogue_sentence .blng_sents_part li');
            if (examples.length > 0) {
                content += `<h3 style="color:#495057; margin-top:10px;">例句</h3>`;
                examples.forEach(li => {
                    const jp = li.querySelector('.sen-eng')?.textContent.trim();
                    const zh = li.querySelector('.sen-ch')?.textContent.trim();
                    if (jp && zh) {
                        content += `<div style="margin-bottom:6px; padding:8px; background:#fff; border:1px solid #e9ecef; border-radius:4px;">
                            <i class="fas fa-quote-left" style="color:#6c757d;"></i> ${escapeHtml(jp)}<br>
                            <small style="color:#495057;">${escapeHtml(zh)}</small>
                        </div>`;
                    }
                });
            }

            content += addFooter('有道日语词典');
            content += `</div>`; // 结束容器
            updatePanelContent(content);
        } catch (err) {
            console.error('解析错误:', err);
            showResult('解析错误', err.message, 'error');
        }
    }

    // ==== 清理节点，彻底去掉“语速”和“发音”文字 ====
    function cleanNodeText(node) {
        const clone = node.cloneNode(true);

        // 移除常见无关标签
        clone.querySelectorAll('button, span, i, sup, audio').forEach(el => el.remove());

        // 递归清理文本节点中包含“语速”或“发音”的部分
        function removeTextNodes(n) {
            for (let i = n.childNodes.length - 1; i >= 0; i--) {
                const child = n.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    if (/语速|发音/.test(child.textContent)) child.remove();
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    removeTextNodes(child);
                }
            }
        }

        removeTextNodes(clone);
        return clone.textContent.trim();
    }

    // ==== 翻译抓取，优先抓“翻译”选项卡 ====
    function getTranslation(doc, word, kana) {
        let translationHtml = '';
        let found = false;

        const tabs = doc.querySelectorAll('.catalogue_paraphrasing .tab-item');
        const modules = doc.querySelectorAll('.catalogue_paraphrasing .fanyi.dict-module');

        let module = null;

        // 遍历 tab-item 找文字为“翻译”的索引
        tabs.forEach((tab, idx) => {
            if (tab.textContent.trim() === '翻译' && modules[idx]) {
                module = modules[idx];
            }
        });

        // 兜底抓第一个模块
        if (!module) module = modules[0];

        if (module) {
            const contentNode = module.querySelector('.trans-content');
            if (contentNode && contentNode.textContent.trim()) {
                const machineInfo = module.querySelector('.secondary')?.innerHTML || '';
                translationHtml += `<div style="border-bottom:2px solid #2575fc; padding-bottom:10px; margin-bottom:10px;">
                <h2 style="color:#2575fc;">${escapeHtml(word)}</h2>
                ${kana ? `<div style="color:#495057;">${escapeHtml(kana)}</div>` : ''}
            </div>`;
                translationHtml += `<h3 style="color:#495057; margin-top:10px;">翻译</h3>
            <div style="margin-bottom:8px; padding:10px; background:#fff3cd; border-radius:6px; border-left:4px solid #ffc107;">
                ${escapeHtml(contentNode.textContent.trim())}
                <div style="margin-top:5px; font-size:0.8rem; color:#6c757d;">
                    ${machineInfo}
                </div>
            </div>`;
                found = true;
            }
        }

        return { html: translationHtml, found };
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
