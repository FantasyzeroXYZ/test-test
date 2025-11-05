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
* [x] 点击英语单词或者日语分词后会自动将词放入剪切板
* 待修复
  * [ ] 日语视频截取时字幕声音对不上？
  * [ ] 切换播放模式后不刷新打开其他内容制卡时截取的还是上一个媒体的音频？
  * [ ] 待查明：偶尔制不了音频卡

## 杂
searchJapaneseWordInPanel 查询日语
displayJapaneseWordDataInPanel 日语查询消息解析生成html
searchWordInPanel 查询英语
displayWordDataInPanel 英语查询消息解析生成html

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