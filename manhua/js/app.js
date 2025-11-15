// app.js - 主应用文件

// 添加全局检查，确保依赖已加载
function checkDependencies() {
    if (typeof ZipProcessor === 'undefined') {
        throw new Error('ZipProcessor未定义！请检查zip.js是否已正确加载');
    }
    if (typeof MokuroParser === 'undefined') {
        throw new Error('MokuroParser未定义！请检查mokuro.js是否已正确加载');
    }
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip未定义！请检查JSZip库是否已正确加载');
    }
    return true;
}

class ComicReaderApp {
    constructor() {
        try {
            console.log('正在初始化ComicReaderApp...');
            
            // 检查依赖
            checkDependencies();
            
            // 初始化处理器
            this.zipProcessor = new ZipProcessor();
            this.mokuroParser = new MokuroParser();
            this.currentImages = [];
            
            console.log('ComicReaderApp初始化成功');
            this.initializeEventListeners();
        } catch (error) {
            console.error('ComicReaderApp初始化失败:', error);
            this.showError(`应用初始化失败: ${error.message}`);
        }
    }

    showError(message) {
        // 在页面上显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 80%;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.parentElement.removeChild(errorDiv);
            }
        }, 5000);
    }

    initializeEventListeners() {
        console.log('初始化事件监听器...');
        
        // ZIP文件上传
        const zipInput = document.getElementById('comic-file');
        if (zipInput) {
            zipInput.addEventListener('change', (e) => {
                this.handleZipUpload(e);
            });
            console.log('ZIP文件输入监听器已添加');
        } else {
            console.error('未找到ZIP文件输入元素');
        }

        // Mokuro文件上传
        const mokuroInput = document.getElementById('mokuro-file');
        if (mokuroInput) {
            mokuroInput.addEventListener('change', (e) => {
                this.handleMokuroUpload(e);
            });
            console.log('Mokuro文件输入监听器已添加');
        } else {
            console.error('未找到Mokuro文件输入元素');
        }
    }

    async handleZipUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            console.log('未选择文件');
            return;
        }

        try {
            console.log('开始上传ZIP文件:', file.name);
            const comicViewer = document.getElementById('comic-viewer');
            
            if (!comicViewer) {
                throw new Error('未找到漫画查看器容器');
            }

            this.currentImages = await this.zipProcessor.processZipFile(file, 
                (processed, total) => {
                    console.log(`处理进度: ${processed}/${total}`);
                }
            );
            
            this.zipProcessor.displayImages(this.currentImages, comicViewer);
            console.log('ZIP文件处理完成');
        } catch (error) {
            console.error('ZIP文件处理失败:', error);
            this.showError('ZIP文件处理失败: ' + error.message);
        }
    }

    async handleMokuroUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            console.log('未选择文件');
            return;
        }

        try {
            console.log('开始上传Mokuro文件:', file.name);
            const mokuroData = await this.mokuroParser.parseMokuroFile(file);
            this.mokuroParser.createAllTextLayers(mokuroData, {
                showBoundingBox: true, // 调试时可设为true
                enableHover: true,
                enableClick: true,
                hoverDisplay: 'tooltip'
            });
            
            console.log('Mokuro文件解析成功', mokuroData);
        } catch (error) {
            console.error('Mokuro文件解析失败:', error);
            this.showError('Mokuro文件解析失败: ' + error.message);
        }
    }

    // 清理资源
    destroy() {
        this.zipProcessor.cleanup(this.currentImages);
        this.mokuroParser.cleanup();
        console.log('ComicReaderApp已清理');
    }
}

// 延迟初始化，确保DOM完全加载
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM内容已加载，开始初始化应用...');
    try {
        window.comicReaderApp = new ComicReaderApp();
        console.log('漫画阅读器应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
        // 显示错误信息给用户
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            color: red;
            padding: 20px;
            text-align: center;
            font-size: 16px;
        `;
        errorMessage.innerHTML = `
            <h3>应用初始化失败</h3>
            <p>${error.message}</p>
            <p>请检查浏览器控制台获取详细信息，并刷新页面重试。</p>
        `;
        document.body.appendChild(errorMessage);
    }
});