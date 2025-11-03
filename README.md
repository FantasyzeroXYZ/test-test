# 测试专用
## 本地服务器启动
* 在文件所在目录下启动本地服务器:`python -m http.server 8080`
* 浏览器访问：`http://localhost:8080/`

* 利用npm下载 npm install 文件

* [x] kuromoji.js进行日语分词
* [x] 日语点击分词查词
* [ ] 日语分词叠加查词
* [ ] 词典释义显示顺序设置和替换



* original-sentence 词典框显示的句子
* panelDictionaryResult 词典框释义显示的部分：html放入
* subtitleItem.addEventListener 字幕句子点击，不同词汇模式 
* updateOriginalSentence 更新句子位置显示
  * 设置在日语模式下以日语的分词块为点击单位？
    * currentLanguageMode 为 'japanese'时
  * 将分好的japaneseWords放入wordClass里
* showJapaneseWordSegmentation核心逻辑修改
  * 将分好的词划分成updateOriginalSentence的块 japaneseWords

