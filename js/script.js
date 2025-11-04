// 获取DOM元素
const mediaModeBtn = document.getElementById('media-mode-btn');
const languageModeBtn = document.getElementById('language-mode-btn');
const subtitleImportBtn = document.getElementById('subtitle-import-btn');
const mediaImportBtn = document.getElementById('media-import-btn');
const videoFileInput = document.getElementById('video-file-input');
const audioFileInput = document.getElementById('audio-file-input');
const subtitleFileInput = document.getElementById('subtitle-file-input');
const trackTitle = document.getElementById('track-title');
const trackDescription = document.getElementById('track-description');
const subtitleText = document.getElementById('subtitle-text');
const toggleSubtitleBtn = document.getElementById('toggle-subtitle-btn');
const subtitleDisplay = document.getElementById('subtitle-display');
const videoPlayer = document.getElementById('player');
const videoSubtitles = document.getElementById('video-subtitles');
const mediaIcon = document.getElementById('media-icon');

// 媒体类型选择
const videoPlayerContainer = document.getElementById('video-player');
const audioPlayerContainer = document.getElementById('audio-player');

// 音频播放器控件
const audioCurrentTime = document.getElementById('audio-current-time');
const audioDuration = document.getElementById('audio-duration');
const audioProgress = document.getElementById('audio-progress');
const audioProgressFilled = document.getElementById('audio-progress-filled');
const progressThumb = document.getElementById('progress-thumb');
const audioVolume = document.getElementById('audio-volume');
const audioVolumeFilled = document.getElementById('audio-volume-filled');
const volumeThumb = document.getElementById('volume-thumb');
const audioPlayPauseBtn = document.getElementById('audio-play-pause-btn');
const audioSubtitles = document.getElementById('audio-subtitles');
const toggleAudioSubtitlesBtn = document.getElementById('toggle-audio-subtitles-btn');

// Anki相关元素
const ankiStatusIndicator = document.getElementById('anki-status-indicator');
const ankiStatusText = document.getElementById('anki-status-text');
const checkAnkiBtn = document.getElementById('check-anki-btn');
const showConfigBtn = document.getElementById('show-config-btn');
const autoConfigSection = document.getElementById('auto-config-section');
const addToAnkiBtn = document.getElementById('panel-add-to-anki-btn');
const customDefinitionInput = document.getElementById('panel-custom-definition-input');

// 字幕跳转相关元素
const prevSentenceBtn = document.getElementById('prev-sentence-btn');
const nextSentenceBtn = document.getElementById('next-sentence-btn');
const timeJumpInput = document.getElementById('time-jump-input');
const timeJumpBtn = document.getElementById('time-jump-btn');
const subtitleList = document.getElementById('subtitle-list');
const showSubtitleListBtn = document.getElementById('show-subtitle-list-btn');
const subtitleListPanel = document.getElementById('subtitle-list-panel');
const closeSubtitleListPanel = document.getElementById('close-subtitle-list-panel');
const toggleVideoSubtitlesBtn = document.getElementById('toggle-video-subtitles-btn');

// 自动配置相关元素
const deckSelect = document.getElementById('deck-select');
const modelSelect = document.getElementById('model-select');
const wordFieldSelect = document.getElementById('word-field-select');
const sentenceFieldSelect = document.getElementById('sentence-field-select');
const definitionFieldSelect = document.getElementById('definition-field-select');
const audioFieldSelect = document.getElementById('audio-field-select');
const imageFieldSelect = document.getElementById('image-field-select');

// 底部面板相关元素
const dictionaryPanel = document.getElementById('dictionary-panel');
const panelOverlay = document.getElementById('panel-overlay');
const closePanelBtn = document.getElementById('close-panel');
const panelDictionaryResult = document.getElementById('panel-dictionary-result');
const panelWordTitle = document.getElementById('panel-word-title');
const panelSearchInput = document.getElementById('panel-search-input');
const panelSearchBtn = document.getElementById('panel-search-btn');
const originalSentence = document.getElementById('original-sentence');
const appendWordBtn = document.getElementById('append-word-btn');
const webSearchFrame = document.getElementById('web-search-frame');

// 新增元素
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');

// 状态变量
let subtitles = [];
let subtitleVisible = true;
let videoSubtitlesVisible = true;
let audioSubtitlesVisible = false;
let currentHighlightedWord = null;
let currentWord = '';
let currentSentence = '';
let currentSubtitleIndex = -1; // 当前字幕索引
let currentMediaFile = null;
let currentMediaType = 'video'; // 'video' 或 'audio'
let currentLanguageMode = 'english'; // 'english' 或 'japanese'
let playerWasPlaying = false;
let ankiConnected = false;
let ankiDecks = [];
let ankiModels = [];
let currentModelFields = [];
let activeTab = 'dictionary-tab'; // 当前激活的标签页，默认标签页
let isProcessingAnki = false; // 防止重复点击
let audioContext = null;
let audioBuffer = null;
let audioElement = null;
let isDraggingProgress = false;
let isDraggingVolume = false;
let japaneseWords = []; // 存储日语分词结果
let tokenizer = null; // 用来存分词器实例
let currentWordIndex = -1; // 当前选择词汇的索引
let appendedWords = []; // 已追加词数组
let isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 初始化函数
async function initKuromoji() {
    return new Promise((resolve, reject) => {
        if (!window.kuromoji) { // 库是否加载
            reject(new Error("kuromoji.js 未加载"));
            return;
        }
        window.kuromoji.builder({ dicPath: "./kuromoji/dict/" }).build(function(err, tk) {
            if (err) { reject(err); return; }
            tokenizer = tk; // 保存实例
            // console.log("kuromoji 初始化成功 ✅"); // 调试输出
            resolve(tk);
        });
    });
}

// 初始化音频上下文
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// 存储配置到localStorage
function saveConfig() {
    const config = {
        deck: deckSelect.value,
        model: modelSelect.value,
        wordField: wordFieldSelect.value,
        sentenceField: sentenceFieldSelect.value,
        definitionField: definitionFieldSelect.value,
        audioField: audioFieldSelect.value,
        imageField: imageFieldSelect.value,
        languageMode: currentLanguageMode,
        mediaType: currentMediaType
    };
    localStorage.setItem('ankiConfig', JSON.stringify(config));
}

// 从localStorage加载配置
function loadConfig() {
    const savedConfig = localStorage.getItem('ankiConfig');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            if (config.deck) deckSelect.value = config.deck;
            if (config.model) modelSelect.value = config.model;
            if (config.wordField) wordFieldSelect.value = config.wordField;
            if (config.sentenceField) sentenceFieldSelect.value = config.sentenceField;
            if (config.definitionField) definitionFieldSelect.value = config.definitionField;
            if (config.audioField) audioFieldSelect.value = config.audioField;
            if (config.imageField) imageFieldSelect.value = config.imageField;
            if (config.languageMode) {
                currentLanguageMode = config.languageMode;
                updateLanguageModeButton();
            }
            if (config.mediaType) {
                currentMediaType = config.mediaType;
                updateMediaModeButton();
                updateMediaDisplay();
            }
        } catch (e) {
            console.error('加载配置失败:', e);
        }
    }
}

// 更新语言模式按钮文本
function updateLanguageModeButton() {
    languageModeBtn.innerHTML = currentLanguageMode === 'english' ? 
        '<i class="fas fa-language"></i> 英语模式' : 
        '<i class="fas fa-language"></i> 日语模式';
}

// 更新媒体模式按钮文本
function updateMediaModeButton() {
    mediaModeBtn.innerHTML = currentMediaType === 'video' ? 
        '<i class="fas fa-video"></i> 视频模式' : 
        '<i class="fas fa-music"></i> 音频模式';
    updateImportButton();
}

// 更新导入按钮文本
function updateImportButton() {
    mediaImportBtn.innerHTML = currentMediaType === 'video' ? 
        '<i class="fas fa-file-video"></i> 视频' : 
        '<i class="fas fa-file-audio"></i> 音频';
}

// 更新媒体显示
function updateMediaDisplay() {
    if (currentMediaType === 'video') {
        videoPlayerContainer.style.display = 'block';
        audioPlayerContainer.style.display = 'none';
    } else {
        videoPlayerContainer.style.display = 'none';
        audioPlayerContainer.style.display = 'block';
    }
    updateControlButtons();
}

// 清除当前媒体和字幕
function clearCurrentMedia() {
    // 停止播放
    if (currentMediaType === 'video') {
        videoPlayer.pause();
        videoPlayer.src = '';
    } else if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioPlayPauseBtn.textContent = '▶';
        audioPlayPauseBtn.classList.remove('active');
    }
    
    // 清除文件引用
    currentMediaFile = null;
    videoFileInput.value = '';
    audioFileInput.value = '';
    
    // 重置轨道信息
    trackTitle.textContent = '未选择媒体文件';
    trackDescription.textContent = '请导入媒体文件开始学习';
    mediaIcon.className = 'fas fa-file';
    
    // 清除字幕
    subtitles = [];
    subtitleFileInput.value = '';
    subtitleText.innerHTML = "无字幕";
    videoSubtitles.innerHTML = "";
    updateSubtitleList();
    updateAudioSubtitles();
    
    // 重置状态
    currentSubtitleIndex = -1;
    currentWord = '';
    currentSentence = '';
    appendedWords = [];
    currentWordIndex = -1;
    panelSearchInput.value = '';
}

// 文件选择事件处理
subtitleImportBtn.addEventListener('click', () => {
    subtitleFileInput.click();
});

mediaImportBtn.addEventListener('click', () => {
    if (currentMediaType === 'video') {
        videoFileInput.click();
    } else {
        audioFileInput.click();
    }
});

// 🎬 视频文件加载
videoFileInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    currentMediaFile = file;
    currentMediaType = 'video';
    trackTitle.textContent = file.name.replace(/\.[^/.]+$/, "");
    trackDescription.textContent = `文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    mediaIcon.className = 'fas fa-video';

    // 暂停音频播放器（如果正在播放）
    if (audioElement && !audioElement.paused) {
        audioElement.pause();
        audioPlayPauseBtn.textContent = '▶';
        audioPlayPauseBtn.classList.remove('active');
    }

    // 创建视频URL并设置播放器
    const fileURL = URL.createObjectURL(file);
    videoPlayer.src = fileURL;

    // 切换到视频模式
    switchToVideoMode();

    // 重置字幕
    subtitles = [];
    subtitleText.innerHTML = "无字幕";
    videoSubtitles.innerHTML = "";
    updateSubtitleList();

    // 尝试加载音频缓冲
    await loadAudioBuffer(file);
});

// 🎵 音频文件加载
audioFileInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    currentMediaFile = file;
    currentMediaType = 'audio';
    trackTitle.textContent = file.name.replace(/\.[^/.]+$/, "");
    trackDescription.textContent = `文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    mediaIcon.className = 'fas fa-music';

    // 暂停视频播放器（如果正在播放）
    if (!videoPlayer.paused) {
        videoPlayer.pause();
    }

    // 创建音频URL并设置播放器
    const fileURL = URL.createObjectURL(file);
    if (!audioElement) {
        audioElement = new Audio();
        initAudioControls();
    }
    audioElement.src = fileURL;

    // 切换到音频模式
    switchToAudioMode();

    // 重置字幕
    subtitles = [];
    subtitleText.innerHTML = "无字幕";
    updateSubtitleList();

    // 加载音频缓冲
    await loadAudioBuffer(file);
});

// 自适应加载音频缓冲（无论是音频或视频）
async function loadAudioBuffer(file) {
    const ctx = getAudioContext();

    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    try {
        // 尝试解码音频（即便是视频，也可能成功提取音轨）
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        // console.log("✅ 音频缓冲加载成功:", audioBuffer); // 调试输出
    } catch (err) {
        console.warn("⚠ 无法直接从文件提取音频:", err);
        audioBuffer = null;
    }
}

// 初始化音频控件
function initAudioControls() {
    if (!audioElement) return;

    // 更新音频时长
    audioElement.addEventListener('loadedmetadata', () => {
        if (audioElement.duration) {
            audioDuration.textContent = formatTime(audioElement.duration);
            updateProgressThumb();
            updateVolumeThumb();
        }
    });
    
    // 播放/暂停按钮
    audioPlayPauseBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            audioPlayPauseBtn.textContent = '⏸';
            audioPlayPauseBtn.classList.add('active');
        } else {
            audioElement.pause();
            audioPlayPauseBtn.textContent = '▶';
            audioPlayPauseBtn.classList.remove('active');
        }
    });
    
    // 进度条点击
    audioProgress.addEventListener('click', (e) => {
        const rect = audioProgress.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = percent * audioElement.duration;
        updateProgressThumb();
    });
    
    // 进度条拖动
    progressThumb.addEventListener('mousedown', startDragProgress);
    progressThumb.addEventListener('touchstart', startDragProgress);
    
    // 音量条点击
    audioVolume.addEventListener('click', (e) => {
        const rect = audioVolume.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioElement.volume = percent;
        updateVolumeThumb();
    });
    
    // 音量条拖动
    volumeThumb.addEventListener('mousedown', startDragVolume);
    volumeThumb.addEventListener('touchstart', startDragVolume);
    
    // 更新进度条和时间显示
    audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration) {
            const percent = (audioElement.currentTime / audioElement.duration) * 100;
            audioProgressFilled.style.width = `${percent}%`;
            audioCurrentTime.textContent = formatTime(audioElement.currentTime);
            
            if (!isDraggingProgress) {
                updateProgressThumb();
            }
        }
        
        // 更新音频字幕
        updateAudioSubtitles();
    });
    
    // 音频播放状态变化
    audioElement.addEventListener('play', () => {
        audioPlayPauseBtn.textContent = '⏸';
        audioPlayPauseBtn.classList.add('active');
    });
    
    audioElement.addEventListener('pause', () => {
        audioPlayPauseBtn.textContent = '▶';
        audioPlayPauseBtn.classList.remove('active');
    });
    
    // 更新音频字幕
    audioElement.addEventListener('timeupdate', () => {
        updateSubtitle(audioElement.currentTime);
    });
}

// 开始拖动进度条
function startDragProgress(e) {
    e.preventDefault();
    isDraggingProgress = true;
    
    const moveHandler = (e) => {
        if (!isDraggingProgress) return;
        
        const rect = audioProgress.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        
        audioElement.currentTime = percent * audioElement.duration;
        updateProgressThumb();
    };
    
    const upHandler = () => {
        isDraggingProgress = false;
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        document.removeEventListener('touchend', upHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchend', upHandler);
}

// 开始拖动音量条
function startDragVolume(e) {
    e.preventDefault();
    isDraggingVolume = true;
    
    const moveHandler = (e) => {
        if (!isDraggingVolume) return;
        
        const rect = audioVolume.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        
        audioElement.volume = percent;
        updateVolumeThumb();
    };
    
    const upHandler = () => {
        isDraggingVolume = false;
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        document.removeEventListener('touchend', upHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchend', upHandler);
}

// 更新进度条滑块位置
function updateProgressThumb() {
    if (!audioElement || !audioElement.duration) return;
    const percent = (audioElement.currentTime / audioElement.duration) * 100;
    progressThumb.style.left = `${percent}%`;
}

// 更新音量滑块位置
function updateVolumeThumb() {
    if (!audioElement) return;
    const percent = audioElement.volume * 100;
    audioVolumeFilled.style.width = `${percent}%`;
    volumeThumb.style.left = `${percent}%`;
}

// 切换到视频模式
function switchToVideoMode() {
    currentMediaType = 'video';
    updateMediaModeButton();
    updateMediaDisplay();
    saveConfig();
}

// 切换到音频模式
function switchToAudioMode() {
    currentMediaType = 'audio';
    updateMediaModeButton();
    updateMediaDisplay();
    saveConfig();
}

// 更新控制按钮显示
function updateControlButtons() {
    // 视频相关按钮
    const videoControls = [toggleVideoSubtitlesBtn];
    // 音频相关按钮
    const audioControls = [toggleAudioSubtitlesBtn];
    
    if (currentMediaType === 'video') {
        videoControls.forEach(btn => {
            if (btn) btn.style.display = 'flex';
        });
        audioControls.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
    } else {
        videoControls.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
        audioControls.forEach(btn => {
            if (btn) btn.style.display = 'flex';
        });
    }
}

// 切换语言模式
function toggleLanguageMode() {
    currentLanguageMode = currentLanguageMode === 'english' ? 'japanese' : 'english';
    updateLanguageModeButton();
    saveConfig();
}

// 切换媒体模式
function toggleMediaMode() {
    // 清除当前媒体和字幕
    clearCurrentMedia();
    
    currentMediaType = currentMediaType === 'video' ? 'audio' : 'video';
    updateMediaModeButton();
    updateMediaDisplay();
    saveConfig();
}

// 模式切换事件
mediaModeBtn.addEventListener('click', toggleMediaMode);

// 语言模式切换事件
languageModeBtn.addEventListener('click', toggleLanguageMode);

// 切换音频字幕显示
toggleAudioSubtitlesBtn.addEventListener('click', () => {
    audioSubtitlesVisible = !audioSubtitlesVisible;
    if (audioSubtitlesVisible) {
        audioSubtitles.classList.add('active');
    } else {
        audioSubtitles.classList.remove('active');
    }
});

// 字幕文件选择处理
subtitleFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            // console.log("加载字幕文件内容"); // 调试输出
            parseSubtitle(content);
        };
        reader.readAsText(file);
    }
});

// 解析字幕文件（支持SRT和VTT格式）
function parseSubtitle(content) {
    subtitles = [];
    // console.log("解析字幕内容"); // 调试输出
    // 检测格式并解析
    if (content.includes('WEBVTT')) {
        // console.log("检测到VTT格式字幕"); // 调试输出
        parseVTTSubtitle(content);
    } else {
        // console.log("检测到SRT格式字幕"); // 调试输出
        parseSRTSubtitle(content);
    }
    
    // 按开始时间排序
    subtitles.sort((a, b) => a.start - b.start);
    
    // 更新字幕列表
    updateSubtitleList();
    updateAudioSubtitles();
    
    // 更新初始字幕显示
    updateSubtitle(0);
}

// 解析SRT字幕
function parseSRTSubtitle(content) {
    // console.log("解析SRT字幕内容"); // 调试输出
    const blocks = content.split(/\n\s*\n/);
    
    blocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
            const timeLine = lines[1];
            const timeMatch = timeLine.match(/(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)/);
            
            if (timeMatch) {
                const startTime = 
                    parseInt(timeMatch[1]) * 3600 + 
                    parseInt(timeMatch[2]) * 60 + 
                    parseInt(timeMatch[3]) + 
                    parseInt(timeMatch[4]) / 1000;
                
                const endTime = 
                    parseInt(timeMatch[5]) * 3600 + 
                    parseInt(timeMatch[6]) * 60 + 
                    parseInt(timeMatch[7]) + 
                    parseInt(timeMatch[8]) / 1000;
                
                // 合并所有文本行，并清理末尾编号
                let text = lines.slice(2).join(' ').trim();
                const rawText = text; // 保存原始文本以备调试
                text = cleanSubtitleText(text);
                // console.log('清理前：', rawText, '→ 清理后：', text); // 调试输出
                
                if (text) {
                    subtitles.push({
                        start: startTime,
                        end: endTime,
                        text: text
                    });
                }
            }
        }
    });
}

// 解析VTT字幕
function parseVTTSubtitle(content) {
    const lines = content.split('\n');
    let currentSubtitle = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('-->')) {
            if (currentSubtitle) {
                subtitles.push(currentSubtitle);
            }
            
            const timeMatch = line.match(/(\d+):(\d+):(\d+)[.,](\d+)\s*-->\s*(\d+):(\d+):(\d+)[.,](\d+)/);
            if (timeMatch) {
                currentSubtitle = {
                    start: parseInt(timeMatch[1]) * 3600 + 
                           parseInt(timeMatch[2]) * 60 + 
                           parseInt(timeMatch[3]) + 
                           parseInt(timeMatch[4]) / 1000,
                    end: parseInt(timeMatch[5]) * 3600 + 
                         parseInt(timeMatch[6]) * 60 + 
                         parseInt(timeMatch[7]) + 
                         parseInt(timeMatch[8]) / 1000,
                    text: ''
                };
            }
        } else if (currentSubtitle && line && !line.includes('WEBVTT') && !line.includes('NOTE')) {
            if (currentSubtitle.text) {
                currentSubtitle.text += ' ' + line;
            } else {
                currentSubtitle.text = line;
            }
        }
    }
    
    if (currentSubtitle && currentSubtitle.text) {
        // 清理字幕文本
        currentSubtitle.text = cleanSubtitleText(currentSubtitle.text);
        subtitles.push(currentSubtitle);
    }
}

// 清理字幕文本，移除末尾的顺序编号和数字
function cleanSubtitleText(text) {
    // 移除HTML标签
    text = text.replace(/<[^>]*>/g, '');

    // 移除常见的尾部编号或顺序号，如 "1", "(1)", "[1]", "-1", "１"（全角数字）
    text = text.replace(/[\s,，.。!！?？(（\[]*[-–—]?[0-9０-９]+[)\]）]*\s*$/u, '');

    // 如果仍有句号、逗号后带数字的情况，如 "castle linderhof, 3" 或 "recently 70"
    text = text.replace(/([,.，。!！?？])\s*[0-9０-９]+\s*$/u, '$1');

    // 移除多个连续空格
    text = text.replace(/\s+/g, ' ');

    return text.trim();
}


// 更新字幕列表
function updateSubtitleList() {
    subtitleList.innerHTML = '';
    
    if (subtitles.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'subtitle-item';
        emptyItem.textContent = '无字幕';
        subtitleList.appendChild(emptyItem);
        return;
    }
    
    subtitles.forEach((subtitle, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'subtitle-item';
        listItem.innerHTML = `
            <div class="subtitle-time">${formatTime(subtitle.start)} - ${formatTime(subtitle.end)}</div>
            <div class="subtitle-content">${subtitle.text}</div>
        `;
        listItem.addEventListener('click', () => {
            // 跳转到该字幕开始时间
            jumpToSubtitle(index);
            closeSubtitleListPanelFunc();
        });
        subtitleList.appendChild(listItem);
    });
    
    updateActiveSubtitleItem();
}

// 更新音频滚动字幕
function updateAudioSubtitles() {
    audioSubtitles.innerHTML = '';
    
    if (subtitles.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'audio-subtitle-item';
        emptyItem.textContent = '无字幕';
        audioSubtitles.appendChild(emptyItem);
        return;
    }
    
    subtitles.forEach((subtitle, index) => {
        const subtitleItem = document.createElement('div');
        subtitleItem.className = 'audio-subtitle-item';
        if (index === currentSubtitleIndex) {
            subtitleItem.classList.add('active');
        }
        
        // 创建可点击的字幕内容
        subtitleItem.innerHTML = createClickableSubtitleContent(subtitle.text, index);
        
        // 添加点击事件
        subtitleItem.addEventListener('click', (e) => {
            handleSubtitleClick(e, subtitle.text, index);
        });
        
        audioSubtitles.appendChild(subtitleItem);
    });
    
    // 确保当前字幕在可视区域内
    ensureCurrentSubtitleVisible();
}

// 确保当前字幕在音频字幕区域中可见
function ensureCurrentSubtitleVisible() {
    if (currentSubtitleIndex >= 0) {
        const activeItem = audioSubtitles.children[currentSubtitleIndex];
        if (activeItem) {
            // 使用平滑滚动，确保当前字幕在可视区域内
            activeItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest' 
            });
        }
    }
}

// 创建可点击的字幕内容（PC端和移动端优化）
function createClickableSubtitleContent(text, index) {
    if (currentLanguageMode === 'english') {
        // 英语模式：创建可点击的单词
        const wordRegex = /[a-zA-Z]+(?:[''’][a-zA-Z]+)*/g;
        let lastIndex = 0;
        let clickableWords = '';
        
        let match;
        while ((match = wordRegex.exec(text)) !== null) {
            // 添加匹配前的非单词部分
            clickableWords += text.substring(lastIndex, match.index);
            
            // 添加可点击的单词（增加class以便划词插件识别）
            clickableWords += `<span class="word selectable-word" data-word="${match[0]}" data-index="${index}">${match[0]}</span>`;
            
            lastIndex = match.index + match[0].length;
        }
        
        // 添加剩余的非单词部分
        clickableWords += text.substring(lastIndex);
        
        return clickableWords;
    } else {
        // 日语模式：显示可点击的分词 - 不加间隔
        return `<span class="japanese-sentence selectable-text" data-sentence="${text}" data-index="${index}">${text}</span>`;
    }
}

// 处理字幕点击事件
function handleSubtitleClick(e, text, index) {
    if (currentLanguageMode === 'english') {
        // 英语模式：点击单词查询
        if (e.target.classList.contains('word')) {
            const word = e.target.getAttribute('data-word');
            
            // 复制单词到剪贴板
            // copyToClipboard(word);
            
            // 点击单词时暂停播放
            pauseCurrentMedia();
            
            // 查询单词并显示底部面板
            searchWordInPanel(word);
            
            // 记录当前单词和句子
            currentWord = word;
            currentSentence = text;
            
            // 更新原句显示
            updateOriginalSentence(currentSentence, word);
        }
    } else {
        // 日语模式：点击句子，显示分词结果
        if (e.target.classList.contains('japanese-sentence')) {
            // 复制句子到剪贴板
            // copyToClipboard(text);
            
            // 点击句子时暂停播放
            pauseCurrentMedia();
            
            // 显示日语分词结果
            showJapaneseWordSegmentation(text);
            
            // 记录当前句子
            currentSentence = text;
        }
    }
}

// 复制文本到剪贴板
// function copyToClipboard(text) {
//     navigator.clipboard.writeText(text).then(() => {
//         // 显示复制成功提示
//         showStatusMessage(`"${text}" 已复制到剪贴板`);
//     }).catch(err => {
//         console.error('复制到剪贴板失败:', err);
//         // 备用方案
//         const textArea = document.createElement('textarea');
//         textArea.value = text;
//         document.body.appendChild(textArea);
//         textArea.select();
//         document.execCommand('copy');
//         document.body.removeChild(textArea);
//         showStatusMessage(`"${text}" 已复制到剪贴板`);
//     });
// }

// 暂停当前媒体播放
function pauseCurrentMedia() {
    if (currentMediaType === 'video') {
        playerWasPlaying = !videoPlayer.paused;
        videoPlayer.pause();
    } else if (audioElement) {
        playerWasPlaying = !audioElement.paused;
        audioElement.pause();
        audioPlayPauseBtn.textContent = '▶';
        audioPlayPauseBtn.classList.remove('active');
    }
}

// 日语分词显示
async function showJapaneseWordSegmentation(sentence, currentWord = '') {
    if (!tokenizer) {
        console.error('分词器未初始化');
        return;
    }

    try {
        const result = tokenizer.tokenize(sentence);
        const japaneseWords = result.map(item => item.surface_form);

        // 打开字典面板
        openDictionaryPanel();

        // 更新原句显示，使用日语分词块
        updateOriginalSentence(sentence, currentWord, 'japanese', japaneseWords);

        // 为字典面板分词绑定点击事件
        panelDictionaryResult.querySelectorAll('.word').forEach(wordElement => {
            wordElement.addEventListener('click', () => {
                const word = wordElement.getAttribute('data-word');
                const index = parseInt(wordElement.getAttribute('data-index'));
                panelDictionaryResult.querySelectorAll('.word').forEach(w => w.classList.remove('highlight'));
                wordElement.classList.add('highlight');
                panelSearchInput.value = word;
                
                // 复制单词到剪贴板
                // copyToClipboard(word);
                
                if (window.japaneseWordClicked) {
                    window.japaneseWordClicked(word, index);
                } else {
                    searchJapaneseWordInPanel(word);
                }
            });
        });

        panelWordTitle.textContent = `日语分词`;

        // 分词完成回调
        if (window.japaneseSegmentationComplete) {
            window.japaneseSegmentationComplete(sentence, japaneseWords);
        }

    } catch (error) {
        console.error('日语分词失败:', error);
        panelDictionaryResult.innerHTML = `<div class="error">日语分词失败: ${error.message}</div>`;
    }
}

// 查询日语单词
async function searchJapaneseWordInPanel(word) {
    if (!word.trim()) {
        panelDictionaryResult.innerHTML = '<div class="error">请输入要查询的单词</div>';
        return;
    }
    
    // 确保面板已打开
    openDictionaryPanel();
    
    panelDictionaryResult.innerHTML = '<div class="loading">查询中...</div>';
    panelWordTitle.textContent = `查询: ${word}`;
    panelSearchInput.value = word;
    
    // 油猴脚本接口：日语查询回调
    if (window.japaneseWordSearch) {
        window.japaneseWordSearch(word);
    } else {
        // 默认行为：使用Jisho API查询日语单词
        try {
            const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            displayJapaneseWordDataInPanel(data);
        } catch (error) {
            panelDictionaryResult.innerHTML = `<div class="error">${error.message}</div>`;
            console.error('查询错误:', error);
        }
    }
}

// 显示日语单词数据在底部面板
function displayJapaneseWordDataInPanel(wordData) {
    let html = '';
    
    if (wordData.data && wordData.data.length > 0) {
        const word = wordData.data[0];
        
        // 单词标题和读音
        html += `<div class="word-header">`;
        html += `<div class="word-title">${word.japanese[0].word || word.japanese[0].reading}</div>`;
        
        if (word.japanese[0].reading) {
            html += `<div class="phonetic">${word.japanese[0].reading}</div>`;
        }
        
        html += `</div>`;
        
        // 词义解释
        if (word.senses && word.senses.length > 0) {
            word.senses.forEach((sense, index) => {
                if (index < 3) { // 只显示前三个定义
                    html += `<div class="meaning-section">`;
                    html += `<div class="part-of-speech">${sense.parts_of_speech.join(', ')}</div>`;
                    
                    if (sense.english_definitions && sense.english_definitions.length > 0) {
                        sense.english_definitions.forEach((def, defIndex) => {
                            if (defIndex < 3) { // 只显示前三个英文定义
                                html += `<div class="definition">${defIndex + 1}. ${def}</div>`;
                            }
                        });
                    }
                    
                    html += `</div>`;
                }
            });
        } else {
            html += `<div class="meaning-section">`;
            html += `<div class="definition">未找到该单词的详细释义。</div>`;
            html += `</div>`;
        }
    } else {
        html += `<div class="meaning-section">`;
        html += `<div class="definition">未找到该单词的详细释义。</div>`;
        html += `</div>`;
    }
    
    panelDictionaryResult.innerHTML = html;
}

// 更新当前激活的字幕项
function updateActiveSubtitleItem() {
    const items = subtitleList.querySelectorAll('.subtitle-item');
    items.forEach((item, index) => {
        if (index === currentSubtitleIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 更新音频滚动字幕
    const audioItems = audioSubtitles.querySelectorAll('.audio-subtitle-item');
    audioItems.forEach((item, index) => {
        if (index === currentSubtitleIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 格式化时间显示
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 查找下一个有字幕的位置
function findNextSubtitleIndex(currentTime) {
    for (let i = 0; i < subtitles.length; i++) {
        if (subtitles[i].start > currentTime) {
            return i;
        }
    }
    return subtitles.length - 1; // 如果没有找到，返回最后一个
}

// 查找上一个有字幕的位置
function findPrevSubtitleIndex(currentTime) {
    for (let i = subtitles.length - 1; i >= 0; i--) {
        if (subtitles[i].end < currentTime) {
            return i;
        }
    }
    return 0; // 如果没有找到，返回第一个
}

// 根据当前时间找到应该显示的字幕索引
function findCurrentSubtitleIndex(currentTime) {
    for (let i = 0; i < subtitles.length; i++) {
        if (currentTime >= subtitles[i].start && currentTime < subtitles[i].end) {
            return i;
        }
    }
    return -1; // 没有找到当前字幕
}

// 更新字幕显示（PC端优化）
function updateSubtitle(currentTime) {
    if (subtitles.length === 0) {
        subtitleText.innerHTML = "无字幕";
        videoSubtitles.innerHTML = "";
        return;
    }
    
    // 查找当前时间对应的字幕
    let foundIndex = findCurrentSubtitleIndex(currentTime);
    
    if (foundIndex !== -1) {
        const currentSubtitle = subtitles[foundIndex];
        currentSubtitleIndex = foundIndex;

        // 更新视频内字幕
        if (videoSubtitlesVisible && currentMediaType === 'video') {
            videoSubtitles.innerHTML = `<span class="video-subtitle-text selectable-text">${currentSubtitle.text}</span>`;
        } else {
            videoSubtitles.innerHTML = "";
        }
        
        // 更新底部字幕显示（PC端优化）
        const text = currentSubtitle.text;
        subtitleText.innerHTML = createClickableSubtitleContent(text, foundIndex);
        subtitleText.style.opacity = '1';
        
        // 添加点击事件委托
        subtitleText.removeEventListener('click', handleSubtitleTextClick);
        subtitleText.addEventListener('click', handleSubtitleTextClick);
        
    } else {
        // 不在任何字幕时间范围内
        subtitleText.style.opacity = '0.5';
        videoSubtitles.innerHTML = "";
        currentSubtitleIndex = -1;
    }
    
    updateActiveSubtitleItem();
    
    // 更新音频滚动字幕
    if (currentMediaType === 'audio') {
        updateAudioSubtitles();
    }
}

// 处理字幕文本点击事件
function handleSubtitleTextClick(e) {
    if (currentLanguageMode === 'english') {
        if (e.target.classList.contains('word')) {
            const word = e.target.getAttribute('data-word');
            const index = parseInt(e.target.getAttribute('data-index'));
            
            // 复制单词到剪贴板
            // copyToClipboard(word);
            
            pauseCurrentMedia();
            searchWordInPanel(word);
            
            currentWord = word;
            if (index >= 0 && index < subtitles.length) {
                currentSentence = subtitles[index].text;
                updateOriginalSentence(currentSentence, word);
            }
            
            // 高亮显示选中的单词
            if (currentHighlightedWord) {
                currentHighlightedWord.classList.remove('highlight');
            }
            e.target.classList.add('highlight');
            currentHighlightedWord = e.target;
        }
    } else {
        if (e.target.classList.contains('japanese-sentence')) {
            const text = e.target.getAttribute('data-sentence');
            const index = parseInt(e.target.getAttribute('data-index'));
            
            // 复制句子到剪贴板
            // copyToClipboard(text);
            
            pauseCurrentMedia();
            showJapaneseWordSegmentation(text);
            
            currentSentence = text;
        }
    }
}

// 更新原句显示（PC端优化）
function updateOriginalSentence(sentence, currentWord, currentLanguageMode = 'english', japaneseWords = []) {
    let clickableSentence = '';

    // 根据语言模式获取词块
    const words = currentLanguageMode === 'japanese' && japaneseWords.length > 0 
        ? japaneseWords 
        : sentence.match(/\S+/g) || []; // 英文或其他语言按空白分词

    words.forEach((word, index) => {
        const wordClass = appendedWords.includes(word) ? 'sentence-word highlight selectable-word' : 'sentence-word selectable-word';

        // 日语模式不加空格，英语模式加空格
        const space = currentLanguageMode === 'japanese' ? '' : '&nbsp;';

        clickableSentence += `<span class="${wordClass}" data-word="${word}" data-index="${index}">${word}</span>${space}`;
    });

    originalSentence.innerHTML = clickableSentence;

    // 点击词块立即搜索并高亮
    originalSentence.removeEventListener('click', handleSentenceWordClick);
    originalSentence.addEventListener('click', handleSentenceWordClick);
}

// 处理原句中单词点击
function handleSentenceWordClick(e) {
    const span = e.target.closest('.sentence-word');
    if (!span) return;

    const word = span.getAttribute('data-word');
    const index = parseInt(span.getAttribute('data-index'));

    // 复制单词到剪贴板
    // copyToClipboard(word);

    // 单击词块 → 重置已选词，只保留当前点击词
    appendedWords = [word];
    currentWordIndex = index;
    panelSearchInput.value = word;

    // 更新高亮
    originalSentence.querySelectorAll('.sentence-word').forEach((s) => {
        s.classList.toggle('highlight', appendedWords.includes(s.getAttribute('data-word')));
    });

    // 立即触发词典搜索
    if (currentLanguageMode === 'english') {
        searchWordInPanel(word);
    } else {
        searchJapaneseWordInPanel(word);
    }

    // 如果当前激活标签页是网页查询，则自动加载网页
    if (activeTab === 'web-tab') {
        loadWebSearch(word);
    }
}

// 在面板中查询单词
async function searchWordInPanel(word) {
    if (!word.trim()) {
        panelDictionaryResult.innerHTML = '<div class="error">请输入要查询的单词</div>';
        return;
    }
    
    // 确保面板已打开
    openDictionaryPanel();
    
    panelDictionaryResult.innerHTML = '<div class="loading">查询中...</div>';
    panelWordTitle.textContent = `查询: ${word}`;
    panelSearchInput.value = word;
    
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`未找到单词 "${word}" 的定义`);
            } else {
                throw new Error(`API请求失败: ${response.status}`);
            }
        }
        
        const data = await response.json();
        displayWordDataInPanel(data[0]);
    } catch (error) {
        panelDictionaryResult.innerHTML = `<div class="error">${error.message}</div>`;
        console.error('查询错误:', error);
    }
}

// 显示单词数据在底部面板（移除编号）
function displayWordDataInPanel(wordData) {
    let html = '';
    
    // 单词标题和音标
    html += `<div class="word-header">`;
    html += `<div class="word-title">${wordData.word}</div>`;
    
    if (wordData.phonetic) {
        html += `<div class="phonetic">${wordData.phonetic}</div>`;
    } else if (wordData.phonetics && wordData.phonetics.length > 0) {
        const phonetic = wordData.phonetics.find(p => p.text) || wordData.phonetics[0];
        if (phonetic && phonetic.text) {
            html += `<div class="phonetic">${phonetic.text}</div>`;
        }
    }
    
    html += `</div>`;
    
    // 词义解释（移除编号）
    if (wordData.meanings && wordData.meanings.length > 0) {
        wordData.meanings.forEach(meaning => {
            html += `<div class="meaning-section">`;
            html += `<div class="part-of-speech">${meaning.partOfSpeech}</div>`;
            
            if (meaning.definitions && meaning.definitions.length > 0) {
                meaning.definitions.forEach((def, index) => {
                    if (index < 3) { // 只显示前三个定义
                        html += `<div class="definition">${def.definition}</div>`;
                        if (def.example) {
                            html += `<div class="example">例句: "${def.example}"</div>`;
                        }
                    }
                });
            }
            
            html += `</div>`;
        });
    } else {
        html += `<div class="meaning-section">`;
        html += `<div class="definition">未找到该单词的详细释义。</div>`;
        html += `</div>`;
    }
    
    panelDictionaryResult.innerHTML = html;
}

// 显示/隐藏字幕
toggleSubtitleBtn.addEventListener('click', () => {
    subtitleVisible = !subtitleVisible;
    subtitleDisplay.style.display = subtitleVisible ? 'block' : 'none';
});

// 切换视频内字幕显示
toggleVideoSubtitlesBtn.addEventListener('click', () => {
    videoSubtitlesVisible = !videoSubtitlesVisible;
    if (!videoSubtitlesVisible) {
        videoSubtitles.innerHTML = "";
    } else if (currentSubtitleIndex >= 0) {
        videoSubtitles.innerHTML = `<span class="video-subtitle-text selectable-text">${subtitles[currentSubtitleIndex].text}</span>`;
    }
});

// 上一句跳转
prevSentenceBtn.addEventListener('click', () => {
    if (subtitles.length === 0) return;
    
    let targetIndex;
    const currentTime = currentMediaType === 'video' ? videoPlayer.currentTime : audioElement.currentTime;
    
    if (currentSubtitleIndex >= 0) {
        // 如果当前有字幕，跳转到前一个字幕
        targetIndex = currentSubtitleIndex - 1;
        if (targetIndex < 0) targetIndex = 0;
    } else {
        // 如果当前没有字幕，查找前一个有字幕的位置
        targetIndex = findPrevSubtitleIndex(currentTime);
    }
    
    jumpToSubtitle(targetIndex);
});

// 下一句跳转
nextSentenceBtn.addEventListener('click', () => {
    if (subtitles.length === 0) return;
    
    let targetIndex;
    const currentTime = currentMediaType === 'video' ? videoPlayer.currentTime : audioElement.currentTime;
    
    if (currentSubtitleIndex >= 0) {
        // 如果当前有字幕，跳转到下一个字幕
        targetIndex = currentSubtitleIndex + 1;
        if (targetIndex >= subtitles.length) targetIndex = subtitles.length - 1;
    } else {
        // 如果当前没有字幕，查找下一个有字幕的位置
        targetIndex = findNextSubtitleIndex(currentTime);
    }
    
    jumpToSubtitle(targetIndex);
});

// 跳转到指定字幕
function jumpToSubtitle(index) {
    if (index < 0 || index >= subtitles.length) return;
    
    if (currentMediaType === 'video') {
        videoPlayer.currentTime = subtitles[index].start;
    } else if (audioElement) {
        audioElement.currentTime = subtitles[index].start;
    }
    currentSubtitleIndex = index;
    updateActiveSubtitleItem();
}

// 时间跳转
timeJumpBtn.addEventListener('click', () => {
    const time = parseFloat(timeJumpInput.value);
    if (!isNaN(time) && time >= 0) {
        if (currentMediaType === 'video') {
            videoPlayer.currentTime = time;
        } else if (audioElement) {
            audioElement.currentTime = time;
        }
    }
});

timeJumpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const time = parseFloat(timeJumpInput.value);
        if (!isNaN(time) && time >= 0) {
            if (currentMediaType === 'video') {
                videoPlayer.currentTime = time;
            } else if (audioElement) {
                audioElement.currentTime = time;
            }
        }
    }
});

// 显示字幕列表
showSubtitleListBtn.addEventListener('click', () => {
    openSubtitleListPanel();
});

// 打开字幕列表面板
function openSubtitleListPanel() {
    // 暂停当前播放
    pauseCurrentMedia();
    
    subtitleListPanel.classList.add('active');
    panelOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // 根据当前播放时间找到应该显示的字幕并定位
    const currentTime = currentMediaType === 'video' ? videoPlayer.currentTime : audioElement.currentTime;
    let targetIndex = findCurrentSubtitleIndex(currentTime);
    
    // 如果没有当前字幕，找下一个字幕
    if (targetIndex === -1) {
        targetIndex = findNextSubtitleIndex(currentTime);
    }
    
    // 如果找到了字幕，定位到该字幕
    if (targetIndex >= 0) {
        const targetItem = subtitleList.querySelector(`.subtitle-item:nth-child(${targetIndex + 1})`);
        if (targetItem) {
            setTimeout(() => {
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 高亮显示
                subtitleList.querySelectorAll('.subtitle-item').forEach(item => {
                    item.classList.remove('active');
                });
                targetItem.classList.add('active');
            }, 100);
        }
    }
}

// 关闭字幕列表面板
function closeSubtitleListPanelFunc() {
    subtitleListPanel.classList.remove('active');
    panelOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // 恢复播放
    if (playerWasPlaying) {
        if (currentMediaType === 'video') {
            videoPlayer.play();
        } else if (audioElement) {
            audioElement.play();
            audioPlayPauseBtn.textContent = '⏸';
            audioPlayPauseBtn.classList.add('active');
        }
    }
}

closeSubtitleListPanel.addEventListener('click', closeSubtitleListPanelFunc);

// 追加词汇功能 - 修复版
appendWordBtn.addEventListener('click', () => {
    const sentenceSpans = originalSentence.querySelectorAll('.sentence-word');
    if (!sentenceSpans.length) return;

    // 如果已经是最后一个词，不再追加
    if (currentWordIndex >= sentenceSpans.length - 1) {
        return;
    }

    currentWordIndex++;
    const currentSpan = sentenceSpans[currentWordIndex];
    const word = currentSpan.getAttribute('data-word');

    // 英语模式下在非第一个词前添加空格
    if (currentLanguageMode === 'english' && appendedWords.length > 0) {
        panelSearchInput.value += ' ' + word;
    } else {
        panelSearchInput.value += word;
    }
    
    appendedWords.push(word);

    // 更新高亮 - 确保高亮与追加词汇一致
    sentenceSpans.forEach((span, idx) => {
        const spanWord = span.getAttribute('data-word');
        span.classList.toggle('highlight', appendedWords.includes(spanWord) && idx <= currentWordIndex);
    });

    // 触发搜索
    if (currentLanguageMode === 'english') {
        searchWordInPanel(panelSearchInput.value);
    } else {
        searchJapaneseWordInPanel(panelSearchInput.value);
    }

    // 如果当前标签页是网页查询 → 自动加载网页
    if (activeTab === 'web-tab') {
        loadWebSearch(panelSearchInput.value);
    }
});

// 重置追加词汇和搜索栏
function resetAppendedWords() {
    currentWordIndex = -1;
    appendedWords = [];
    panelSearchInput.value = '';
    
    // 清除原句高亮
    originalSentence.querySelectorAll('.sentence-word').forEach(span => {
        span.classList.remove('highlight');
    });
}

// Anki连接检查
async function checkAnkiConnection() {
    ankiStatusText.textContent = '检查Anki连接状态...';
    
    try {
        const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'version',
                version: 6
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.result) {
                ankiConnected = true;
                ankiStatusIndicator.className = 'status-indicator status-connected';
                ankiStatusText.textContent = 'Anki已连接';
                
                // 获取牌组和模型信息
                await loadAnkiDecks();
                await loadAnkiModels();
            } else {
                throw new Error('AnkiConnect响应错误');
            }
        } else {
            throw new Error('AnkiConnect响应错误');
        }
    } catch (error) {
        ankiConnected = false;
        ankiStatusIndicator.className = 'status-indicator status-disconnected';
        ankiStatusText.textContent = 'Anki未连接';
        console.error('Anki连接错误:', error);
    }
}

// 获取Anki牌组列表
async function loadAnkiDecks() {
    try {
        const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'deckNames',
                version: 6
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            ankiDecks = data.result;
            
            // 更新牌组选择框
            deckSelect.innerHTML = '';
            ankiDecks.forEach(deck => {
                const option = document.createElement('option');
                option.value = deck;
                option.textContent = deck;
                deckSelect.appendChild(option);
            });
            
            // 加载保存的配置
            loadConfig();
        }
    } catch (error) {
        console.error('获取牌组列表错误:', error);
    }
}

// 获取Anki模型列表
async function loadAnkiModels() {
    try {
        const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'modelNames',
                version: 6
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            ankiModels = data.result;
            
            // 更新模型选择框
            modelSelect.innerHTML = '';
            ankiModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            
            // 加载保存的配置
            loadConfig();
            
            // 默认选择第一个模型并加载字段
            if (ankiModels.length > 0 && !modelSelect.value) {
                modelSelect.value = ankiModels[0];
                await loadModelFields(ankiModels[0]);
            } else if (modelSelect.value) {
                // 如果已有保存的模型，加载其字段
                await loadModelFields(modelSelect.value);
            }
        }
    } catch (error) {
        console.error('获取模型列表错误:', error);
    }
}

// 获取模型字段
async function loadModelFields(modelName) {
    try {
        const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'modelFieldNames',
                version: 6,
                params: {
                    modelName: modelName
                }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentModelFields = data.result;
            
            // 更新字段选择框
            wordFieldSelect.innerHTML = '';
            sentenceFieldSelect.innerHTML = '';
            definitionFieldSelect.innerHTML = '';
            audioFieldSelect.innerHTML = '';
            imageFieldSelect.innerHTML = '';
            
            currentModelFields.forEach(field => {
                const option = document.createElement('option');
                option.value = field;
                option.textContent = field;
                
                wordFieldSelect.appendChild(option.cloneNode(true));
                sentenceFieldSelect.appendChild(option.cloneNode(true));
                definitionFieldSelect.appendChild(option.cloneNode(true));
                audioFieldSelect.appendChild(option.cloneNode(true));
                imageFieldSelect.appendChild(option.cloneNode(true));
            });
            
            // 加载保存的配置
            loadConfig();
            
            // 如果字段为空，尝试智能设置默认字段
            if (!wordFieldSelect.value) {
                setDefaultFields();
            }
        }
    } catch (error) {
        console.error('获取模型字段错误:', error);
    }
}

// 智能设置默认字段
function setDefaultFields() {
    const fields = currentModelFields.map(f => f.toLowerCase());
    
    // 设置单词字段
    if (fields.includes('word')) {
        wordFieldSelect.value = 'word';
    } else if (fields.includes('front')) {
        wordFieldSelect.value = 'front';
    } else if (fields.length > 0) {
        wordFieldSelect.selectedIndex = 0;
    }
    
    // 设置句子字段
    if (fields.includes('sentence')) {
        sentenceFieldSelect.value = 'sentence';
    } else if (fields.includes('example')) {
        sentenceFieldSelect.value = 'example';
    } else if (fields.includes('back')) {
        sentenceFieldSelect.value = 'back';
    } else if (fields.length > 1) {
        sentenceFieldSelect.selectedIndex = 1;
    }
    
    // 设置释义字段
    if (fields.includes('definition')) {
        definitionFieldSelect.value = 'definition';
    } else if (fields.includes('meaning')) {
        definitionFieldSelect.value = 'meaning';
    } else if (fields.includes('back')) {
        definitionFieldSelect.value = 'back';
    } else if (fields.length > 2) {
        definitionFieldSelect.selectedIndex = 2;
    }
    
    // 设置音频字段
    if (fields.includes('audio')) {
        audioFieldSelect.value = 'audio';
    } else if (fields.includes('sound')) {
        audioFieldSelect.value = 'sound';
    } else if (fields.length > 3) {
        audioFieldSelect.selectedIndex = 3;
    }
    
    // 设置图片字段
    if (fields.includes('image')) {
        imageFieldSelect.value = 'image';
    } else if (fields.includes('picture')) {
        imageFieldSelect.value = 'picture';
    } else if (fields.length > 4) {
        imageFieldSelect.selectedIndex = 4;
    }
    
    // 保存配置
    saveConfig();
}

// 检查Anki连接
checkAnkiBtn.addEventListener('click', checkAnkiConnection);

// 显示/隐藏配置
showConfigBtn.addEventListener('click', () => {
    const isHidden = autoConfigSection.classList.contains('hidden');
    if (isHidden) {
        autoConfigSection.classList.remove('hidden');
        showConfigBtn.textContent = '收起';
    } else {
        autoConfigSection.classList.add('hidden');
        showConfigBtn.textContent = '配置';
    }
});

// 模型选择变化时加载字段
modelSelect.addEventListener('change', () => {
    loadModelFields(modelSelect.value);
    saveConfig();
});

// 配置变化时保存
deckSelect.addEventListener('change', saveConfig);
wordFieldSelect.addEventListener('change', saveConfig);
sentenceFieldSelect.addEventListener('change', saveConfig);
definitionFieldSelect.addEventListener('change', saveConfig);
audioFieldSelect.addEventListener('change', saveConfig);
imageFieldSelect.addEventListener('change', saveConfig);

// 页面加载时保存原始按钮 HTML
const originalAddToAnkiHTML = addToAnkiBtn.innerHTML;

// 修复：简化Anki添加流程，移除异步等待
addToAnkiBtn.addEventListener('click', async () => {
    if (isProcessingAnki) return;

    if (!ankiConnected) {
        alert('请先连接Anki!');
        return;
    }

    const word = panelSearchInput.value.trim();
    if (!word) {
        alert('请输入要添加的单词!');
        return;
    }

    // 获取词典内容
    let definition = '';

    // 根据当前激活的标签页获取释义
    if (activeTab === 'dictionary-tab') {
        // 从词典释义标签页获取内容
        const definitionElements = panelDictionaryResult.querySelectorAll('.definition');
        if (definitionElements.length > 0) {
            definitionElements.forEach(el => {
                definition += el.textContent + '\n';
            });
        }
    } else if (activeTab === 'custom-tab') {
        // 从自定义释义标签页获取内容
        definition = customDefinitionInput.value.trim();
    }

    if (!definition) {
        alert('请提供单词释义!');
        return;
    }

    // 防止重复点击
    isProcessingAnki = true;
    addToAnkiBtn.disabled = true;

    // 显示处理中状态
    addToAnkiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        // 处理Anki卡片
        await processAnkiCard(word, definition);
        console.log('卡片添加成功');

        // 重置表单
        customDefinitionInput.value = '';
        panelSearchInput.value = '';
        panelDictionaryResult.innerHTML = '查询结果将显示在这里...';

        // 关闭面板
        closeDictionaryPanel();

    } catch (error) {
        console.error('添加卡片失败:', error);
        alert('添加卡片失败: ' + error.message);

    } finally {
        // 重置处理状态，恢复按钮原始 HTML
        isProcessingAnki = false;
        addToAnkiBtn.disabled = false;
        addToAnkiBtn.innerHTML = originalAddToAnkiHTML;
    }
});

// 修复音频截取问题 - 使用之前成功的代码
async function processAnkiCard(word, definition) {
    console.log('audioBuffer', audioBuffer, 'audioContext', audioContext, 'currentSubtitleIndex', currentSubtitleIndex);

    // 清理句子中的编号
    let cleanSentence = currentSentence;
    if (cleanSentence) {
        cleanSentence = cleanSubtitleText(cleanSentence);
    }

    const note = {
        deckName: deckSelect.value,
        modelName: modelSelect.value,
        fields: {
            [wordFieldSelect.value]: word,
            [sentenceFieldSelect.value]: cleanSentence, // 使用清理后的句子，不加编号
            [definitionFieldSelect.value]: definition
        },
        options: { allowDuplicate: false },
        tags: ['media-player']
    };

    // 自动截取当前单词所在字幕音频 - 从字幕开始到结束
    if (audioBuffer && currentSubtitleIndex >= 0) {
        try {
            const audioBlob = await generateAudioClip(currentSubtitleIndex);
            if (audioBlob) {
                const storedAudioName = await processAudioFile(word, audioBlob);
                if (storedAudioName) {
                    note.fields[audioFieldSelect.value] = `[sound:${storedAudioName}]`;
                    console.log('音频字段设置:', storedAudioName);
                }
            }
        } catch (error) {
            console.error('音频截取失败:', error);
        }
    }

    // 处理截图
    if (imageFieldSelect.value && currentMediaType === 'video' && currentMediaFile) {
        try {
            const storedImageName = await captureVideoFrame(word);
            if (storedImageName) {
                note.fields[imageFieldSelect.value] = `<img src="${storedImageName}">`;
                console.log('图片字段设置:', storedImageName);
            }
        } catch (error) {
            console.error('截图失败:', error);
        }
    }

    // 添加到 Anki
    await addCardToAnki(note);
}

// 生成文件名
function generateAudioFileName(word) {
    const cleanWord = word.replace(/[^a-z]/gi, '').toLowerCase() || 'audio';
    // 增加时间戳避免重名
    let fileName = `audio_${cleanWord}_${Date.now()}.wav`;
    fileName = fileName.replace(/[^\w.\-]/g, '_');
    return fileName;
}

function generateImageFileName(word) {
    const cleanWord = word.replace(/[^a-z]/gi, '').toLowerCase() || 'screenshot';
    // 增加时间戳避免重名
    let fileName = `screenshot_${cleanWord}_${Date.now()}.jpg`;
    fileName = fileName.replace(/[^\w.\-]/g, '_');
    return fileName;
}

// 自动截取当前字幕的音频片段 - 从字幕开始到结束
async function processAudioFile(word, audioBlob) {
    try {
        const audioFileName = generateAudioFileName(word);
        console.log('准备存储音频文件:', audioFileName);

        const base64Audio = await blobToBase64(audioBlob);

        const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'storeMediaFile',
                version: 6,
                params: {
                    filename: audioFileName,
                    data: base64Audio.split(',')[1],
                    deleteExisting: true
                }
            })
        });

        const result = await response.json();
        if (result.error) {
            console.error('存储音频文件失败:', result.error);
            return null;
        }

        const storedName = result.result || audioFileName;
        console.log('音频文件实际存储名:', storedName);
        return storedName;

    } catch (error) {
        console.error('音频处理错误:', error);
        return null;
    }
}
        
// 截图功能
async function captureVideoFrame(word) {
    return new Promise((resolve, reject) => {
        try {
            // 创建canvas元素
            const canvas = document.createElement('canvas');
            const video = document.getElementById('player');
            
            // 设置canvas尺寸与视频一致
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // 绘制视频当前帧到canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // 将canvas转换为Blob
            canvas.toBlob(async (blob) => {
                try {
                    const imageFileName = generateImageFileName(word);
                    const base64Image = await blobToBase64(blob);

                    const response = await fetch('http://127.0.0.1:8765', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'storeMediaFile',
                            version: 6,
                            params: {
                                filename: imageFileName,
                                data: base64Image.split(',')[1],
                                deleteExisting: true
                            }
                        })
                    });

                    const result = await response.json();
                    if (result.error) {
                        console.error('存储图片文件失败:', result.error);
                        reject(new Error(result.error));
                        return;
                    }

                    // 使用返回的 result 字段（实际文件名）
                    const storedName = result.result || imageFileName;
                    console.log('图片文件实际存储名:', storedName);
                    resolve(storedName);
                } catch (error) {
                    console.error('图片处理错误:', error);
                    reject(error);
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            console.error('截图错误:', error);
            reject(error);
        }
    });
}

function bufferToWavBlob(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);

    // 写 WAV 头部
    let offset = 0;
    function writeString(s) {
        for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
    }

    function write16(v) { view.setInt16(offset, v, true); offset += 2; }
    function write32(v) { view.setUint32(offset, v, true); offset += 4; }

    writeString('RIFF');
    write32(length - 8);
    writeString('WAVEfmt ');
    write32(16);
    write16(1);
    write16(numChannels);
    write32(sampleRate);
    write32(sampleRate * numChannels * 2);
    write16(numChannels * 2);
    write16(16);
    writeString('data');
    write32(length - 44);

    // 写音频数据
    for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            let sample = buffer.getChannelData(ch)[i];
            sample = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([view], { type: 'audio/wav' });
}

// 生成当前句子的音频片段 - 从字幕开始到结束
async function generateAudioClip(subtitleIndex) {
    if (!audioBuffer) throw new Error('audioBuffer 未加载');

    const startTime = subtitles[subtitleIndex].start; // 单词对应字幕开始时间
    const endTime = subtitles[subtitleIndex].end;     // 单词对应字幕结束时间

    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const frameCount = endSample - startSample;

    const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        frameCount,
        sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            newData[i] = oldData[startSample + i];
        }
    }

    // 转 Blob
    return bufferToWavBlob(newBuffer);
}
            
// 将AudioBuffer转换为WAV Blob
function bufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    
    // 计算数据大小
    const dataSize = length * blockAlign;
    
    // 创建WAV文件头
    const bufferArray = new ArrayBuffer(44 + dataSize);
    const view = new DataView(bufferArray);
    
    // RIFF标识
    writeString(view, 0, 'RIFF');
    // 文件长度
    view.setUint32(4, 36 + dataSize, true);
    // WAVE标识
    writeString(view, 8, 'WAVE');
    // fmt chunk
    writeString(view, 12, 'fmt ');
    // fmt chunk长度
    view.setUint32(16, 16, true);
    // 音频格式 (1 = PCM)
    view.setUint16(20, 1, true);
    // 声道数
    view.setUint16(22, numChannels, true);
    // 采样率
    view.setUint32(24, sampleRate, true);
    // 字节率
    view.setUint32(28, sampleRate * blockAlign, true);
    // 块对齐
    view.setUint16(32, blockAlign, true);
    // 位深度
    view.setUint16(34, bytesPerSample * 8, true);
    // data chunk
    writeString(view, 36, 'data');
    // data chunk长度
    view.setUint32(40, dataSize, true);
    
    // 写入PCM数据
    const offset = 44;
    let index = 0;
    
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset + index, int16Sample, true);
            index += 2;
        }
    }
    
    return new Blob([bufferArray], { type: 'audio/wav' });
}
        
// 写入字符串到DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

async function addCardToAnki(note) {
    console.log('准备添加卡片到 Anki:', note);

    try {
        const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'addNote',
                version: 6,
                params: { note }
            }),
        });

        // 检查 HTTP 层面
        if (!response.ok) {
            throw new Error(`AnkiConnect HTTP错误: ${response.status} ${response.statusText}`);
        }

        // 尝试解析返回结果
        let result;
        try {
            result = await response.json();
        } catch (err) {
            throw new Error('无法解析 AnkiConnect 返回的 JSON。可能未启动 AnkiConnect。');
        }

        // 检查 API 层面错误
        if (result.error) {
            // 常见情况：卡片已存在
            if (result.error.includes('cannot create note because it is a duplicate')) {
                console.warn('检测到重复卡片，未添加:', note.fields);
                showStatusMessage('⚠️ 已存在相同卡片，跳过添加。');
                return null;
            } else {
                console.error('添加卡片失败:', result.error);
                console.error('卡片数据:', note);
                showStatusMessage('❌ 添加卡片失败，请查看控制台日志。');
                throw new Error(result.error);
            }
        }

        // 确保 result.result 存在
        if (!result.result) {
            console.warn('AnkiConnect 返回空结果，可能未创建卡片。');
            showStatusMessage('⚠️ 未创建卡片，可能是重复或模型不匹配。');
            return null;
        }

        console.log('✅ 卡片添加成功，ID:', result.result);
        showStatusMessage('✅ 卡片已成功添加到 Anki!');
        return result.result;

    } catch (error) {
        console.error('❌ 与 AnkiConnect 通信失败:', error);
        showStatusMessage('❌ 无法连接到 AnkiConnect，请确认它已运行。');
        return null;
    }
}

// 一个简单的状态提示函数（可替换 alert）
function showStatusMessage(message) {
    // ✅ 在网页上浮动提示（不会阻塞）
    const div = document.createElement('div');
    div.textContent = message;
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.background = 'rgba(0,0,0,0.8)';
    div.style.color = '#fff';
    div.style.padding = '8px 12px';
    div.style.borderRadius = '6px';
    div.style.fontSize = '14px';
    div.style.zIndex = '9999';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

// 将Blob转换为Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
        
// 底部面板功能
function openDictionaryPanel() {
    panelDictionaryResult.style.display = 'block'; //测试
    panelWordTitle.style.display = 'block';  //测试
    dictionaryPanel.classList.add('active');
    panelOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDictionaryPanel() {
    panelDictionaryResult.style.display = 'none'; //测试
    panelWordTitle.style.display = 'none'; //测试
    dictionaryPanel.classList.remove('active');
    panelOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // 恢复播放
    if (playerWasPlaying) {
        if (currentMediaType === 'video' && videoPlayer.paused) {
            videoPlayer.play();
        } else if (currentMediaType === 'audio' && audioElement && audioElement.paused) {
            audioElement.play();
            audioPlayPauseBtn.textContent = '⏸';
            audioPlayPauseBtn.classList.add('active');
        }
    }

    // 清空搜索栏和追加状态
    resetAppendedWords();
}

closePanelBtn.addEventListener('click', closeDictionaryPanel);
panelOverlay.addEventListener('click', () => {
    closeDictionaryPanel();
    closeSubtitleListPanelFunc();
});

// 面板搜索功能
panelSearchBtn.addEventListener('click', () => {
    const word = panelSearchInput.value.trim();
    if (currentLanguageMode === 'english') {
        searchWordInPanel(word);
    } else {
        searchJapaneseWordInPanel(word);
    }
});

panelSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const word = panelSearchInput.value.trim();
        if (currentLanguageMode === 'english') {
            searchWordInPanel(word);
        } else {
            searchJapaneseWordInPanel(word);
        }
    }
});

// 新增：标签页切换功能
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // 更新激活的标签页
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        // 更新当前激活的标签页
        activeTab = tabId;
        
        // 如果是网页查询标签，加载预设的网页
        if (tabId === 'web-tab') {
            const word = panelSearchInput.value.trim();
            if (word) {
                loadWebSearch(word);
            }
        }
    });
});

// 加载网页查询
function loadWebSearch(word) {
    if (!word) return;
    
    // 油猴脚本接口：网页查询回调
    if (window.webSearch) {
        window.webSearch(word);
    } else {
        // 默认行为：使用Jisho进行日语查询
        const url = currentLanguageMode === 'japanese' ? 
            `https://jisho.org/search/${encodeURIComponent(word)}` :
            `https://www.youdao.com/result?word=${encodeURIComponent(word)}&lang=en`;
        webSearchFrame.src = url;
    }
}

// 监听播放器时间更新
videoPlayer.addEventListener('timeupdate', event => {
    updateSubtitle(videoPlayer.currentTime);
});

// 初始化
async function init() {
    // 检查Anki连接
    checkAnkiConnection();
    
    // 加载配置
    loadConfig();
    
    // 更新按钮状态
    updateLanguageModeButton();
    updateMediaModeButton();
    updateControlButtons();
    updateMediaDisplay();
    
    // 初始化音频元素
    if (!audioElement) {
        audioElement = new Audio();
        initAudioControls();
    }
    
    // 初始化 kuromoji 分词器
    try {
        await initKuromoji(); // 确保分词器实例已经生成
        if (!tokenizer) {
            console.error("分词器未初始化");
            return;
        }

        // 调试分词
        // const sentence = "すもももももももものうち";  
        // const tokens = tokenizer.tokenize(sentence);
        // console.log(tokens.map(t => t.surface_form).join(" | "));
    } catch (err) {
        console.error("初始化失败:", err);
    }
}

// 启动初始化
init();

// 油猴脚本接口
window.mediaPlayer = {
    // 设置日语分词结果
    setJapaneseSegmentation: (words) => {
        japaneseWords = words;
        currentWordIndex = 0;
    },
    
    // 设置日语查询结果
    setJapaneseWordData: (html) => {
        panelDictionaryResult.innerHTML = html;
    },
    
    // 设置网页查询URL
    setWebSearchUrl: (url) => {
        webSearchFrame.src = url;
    },
    
    // 获取当前状态
    getState: () => ({
        currentWord: currentWord,
        currentSentence: currentSentence,
        currentLanguageMode: currentLanguageMode,
        currentMediaType: currentMediaType
    })
};

// document.head.appendChild(style);