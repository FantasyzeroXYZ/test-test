# 测试专用
## 本地服务器启动
* 在文件所在目录下启动本地服务器:`python -m http.server 8080`
* 浏览器访问：`http://localhost:8080/`
## 其他
* 相对路径一般为`./abc/abc.js`,根目录要用.表示
* 利用npm下载 npm install 文件

## 拆分
```

```
## 处理
* [x] kuromoji.js进行日语分词
* [x] 日语点击分词查词
* [x] 日语分词叠加查词
* [x] 网页词典在点击不同词后自动搜索显示
* [x] 将anki添加按钮变成anki的logo图标
* [x] 音频截取问题
* [ ] 音频视频模式切换没有显示对应画面
* [ ] 词典释义显示顺序设置和替换
* [ ] 打开全部字幕时，滚动到当前位置
* [ ] 截取音频有时和字幕时间对不上
* [ ] 移动端音频制卡的延迟问题

## 杂
* original-sentence 词典框显示的句子
* panelDictionaryResult 词典框释义显示的部分：html放入
* subtitleItem.addEventListener 字幕句子点击，不同词汇模式 
* updateOriginalSentence 更新句子位置显示
  * 设置在日语模式下以日语的分词块为点击单位？
    * currentLanguageMode 为 'japanese'时
  * 将分好的japaneseWords放入wordClass里
* showJapaneseWordSegmentation核心逻辑修改
  * 将分好的词划分成updateOriginalSentence的块 japaneseWords

* appendWordBtn是追加词汇按钮
* appendWordBtn.addEventListener监听
  * 改成所有语言模式都可以用这个功能
  * 可以叠加把词块合并放入搜索栏搜索


* wordclass句子点击单位
* clickableSentence点击句子成分？
* 输入：clickableSentence
* panelSearchInput


tabButtons标签页
网页查询
每次点击新词后如果是显示网页栏，网页栏也自动搜索


* 标签页顺序修改
  * tab-content
  * dictionary-tabs


* 相同函数冲突

        // 修复音频截取问题 - 使用之前成功的代码
        async function processAnkiCard(word, definition) {
            console.log('audioBuffer', audioBuffer, 'audioContext', audioContext, 'currentSubtitleIndex', currentSubtitleIndex);
            // 调试

            // 准备Anki卡片数据
            const note = {
                deckName: deckSelect.value,
                modelName: modelSelect.value,
                fields: {
                    [wordFieldSelect.value]: word,
                    [sentenceFieldSelect.value]: currentSentence,
                    [definitionFieldSelect.value]: definition
                },
                options: {
                    allowDuplicate: false
                },
                tags: ['media-player']
            };
            
            // 如果有音频，先处理音频
            if (audioBuffer && audioContext && currentSubtitleIndex >= 0) {
                try {
                    const audioFileName = await processAudioFile(word);
                    if (audioFileName) {
                        // 确保音频字段引用格式正确
                        note.fields[audioFieldSelect.value] = `[sound:${audioFileName}]`;
                        console.log('音频字段设置:', audioFileName);
                    }
                } catch (error) {
                    console.error('音频处理失败:', error);
                    // 即使音频处理失败，仍然继续添加卡片
                }
            }
            
            // 如果有图片字段设置，则截图
            if (imageFieldSelect.value && currentMediaType === 'video' && currentMediaFile) {
                try {
                    const imageFileName = await captureVideoFrame(word);
                    if (imageFileName) {
                        note.fields[imageFieldSelect.value] = `<img src="${imageFileName}">`;
                        console.log('图片字段设置:', imageFileName);
                    }
                } catch (error) {
                    console.error('截图失败:', error);
                    // 即使截图失败，仍然继续添加卡片
                }
            }
            
            // 添加卡片到Anki
            await addCardToAnki(note);
        }


        // 处理整张卡片
        async function processAnkiCard(word, definition) {
            const note = {
                deckName: deckSelect.value,
                modelName: modelSelect.value,
                fields: {
                    [wordFieldSelect.value]: word,
                    [sentenceFieldSelect.value]: currentSentence,
                    [definitionFieldSelect.value]: definition
                },
                options: { allowDuplicate: false },
                tags: ['media-player']
            };

            // 若有音频，先处理音频
            if (audioBuffer && audioContext && currentSubtitleIndex >= 0) {
                try {
                    const storedAudioName = await processAudioFile(word);
                    if (storedAudioName) {
                        note.fields[audioFieldSelect.value] = `[sound:${storedAudioName}]`;
                        console.log('音频字段设置:', storedAudioName);
                    }
                } catch (error) {
                    console.error('音频处理失败:', error);
                }
            }

            // 若有图片字段设置，则截图
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

            await addCardToAnki(note);
        }




        // 加载音频文件到Web Audio API
        async function loadAudioBuffer(file) {
            try {
                // 创建AudioContext
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // 读取文件
                const arrayBuffer = await file.arrayBuffer();
                audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                console.log('音频文件已加载到Web Audio API');
            } catch (error) {
                console.error('加载音频文件失败:', error);
            }
        }




                async function processAnkiCard(word, definition) {
            console.log('audioBuffer', audioBuffer, 'audioContext', audioContext, 'currentSubtitleIndex', currentSubtitleIndex);

            const note = {
                deckName: deckSelect.value,
                modelName: modelSelect.value,
                fields: {
                    [wordFieldSelect.value]: word,
                    [sentenceFieldSelect.value]: currentSentence,
                    [definitionFieldSelect.value]: definition
                },
                options: { allowDuplicate: false },
                tags: ['media-player']
            };

            // 处理音频
            if (audioBuffer && audioContext && currentSubtitleIndex >= 0) {
                try {
                    const storedAudioName = await processAudioFile(word);
                    if (storedAudioName) {
                        note.fields[audioFieldSelect.value] = `[sound:${storedAudioName}]`;
                        console.log('音频字段设置:', storedAudioName);
                    } else {
                        console.warn('音频未生成');
                    }
                } catch (error) {
                    console.error('音频处理失败:', error);
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

    note.fields[audioFieldSelect.value] = `[sound:${storedAudioName}]`;




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
        
        // 视频文件选择处理
        videoFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                currentMediaFile = file;
                currentMediaType = 'video';
                trackTitle.textContent = file.name.replace(/\.[^/.]+$/, ""); // 移除扩展名
                trackDescription.textContent = `文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
                mediaIcon.className = 'fas fa-video';
                
                // 暂停音频播放器（如果正在播放）
                if (audioElement && !audioElement.paused) {
                    audioElement.pause();
                    audioPlayPauseBtn.textContent = '▶';
                }
                
                // 创建文件URL并设置播放器源
                const fileURL = URL.createObjectURL(file);
                videoPlayer.src = fileURL;
                
                // 切换到视频模式
                switchToVideoMode();
                
                // 显示视频播放器
                videoPlayerContainer.classList.add('active');
                
                // 重置字幕
                subtitles = [];
                subtitleText.innerHTML = "无字幕";
                videoSubtitles.innerHTML = "";
                updateSubtitleList();
            }
        });
        