// zip.js - 处理漫画ZIP压缩包

// 确保JSZip可用
if (typeof JSZip === 'undefined') {
    console.error('JSZip库未加载！请确保在zip.js之前引入JSZip');
}

// 使用var或直接声明，确保在全局作用域中可用
class ZipProcessor {
    constructor() {
        this.zip = new JSZip();
        console.log('ZipProcessor初始化完成');
    }

    /**
     * 处理上传的ZIP文件
     * @param {File} file - 用户选择的ZIP文件
     * @param {Function} onProgress - 处理进度回调函数
     * @returns {Promise<Array>} - 解析后的图片数据数组
     */
    async processZipFile(file, onProgress = null) {
        try {
            console.log('开始处理ZIP文件:', file.name);
            
            // 重新创建JSZip实例，避免重复使用的问题
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            const imageFiles = [];
            const totalFiles = Object.keys(zipContent.files).length;
            let processedFiles = 0;

            // 筛选图片文件
            for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
                if (!zipEntry.dir && this.isImageFile(filename)) {
                    imageFiles.push({
                        filename,
                        zipEntry
                    });
                }
            }

            // 按文件名排序，确保页码顺序正确
            imageFiles.sort((a, b) => a.filename.localeCompare(b.filename));
            console.log(`找到 ${imageFiles.length} 个图片文件`);

            // 处理所有图片文件
            const results = [];
            for (const imageFile of imageFiles) {
                try {
                    const imageData = await this.processImageFile(zip, imageFile);
                    results.push(imageData);
                    
                    processedFiles++;
                    if (onProgress) {
                        onProgress(processedFiles, imageFiles.length);
                    }
                } catch (error) {
                    console.error(`处理图片失败 ${imageFile.filename}:`, error);
                }
            }

            console.log('ZIP文件处理完成');
            return results;
        } catch (error) {
            console.error('处理ZIP文件失败:', error);
            throw new Error(`ZIP文件处理失败: ${error.message}`);
        }
    }

    /**
     * 检查是否为图片文件
     * @param {string} filename - 文件名
     * @returns {boolean}
     */
    isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return imageExtensions.includes(ext);
    }

    /**
     * 处理单个图片文件
     * @param {JSZip} zip - JSZip实例
     * @param {Object} imageFile - 图片文件对象
     * @returns {Promise<Object>} - 图片数据
     */
    async processImageFile(zip, imageFile) {
        // 获取图片的ArrayBuffer数据
        const arrayBuffer = await imageFile.zipEntry.async('arraybuffer');
        
        // 创建Blob URL用于图片显示
        const blob = new Blob([arrayBuffer]);
        const objectURL = URL.createObjectURL(blob);

        return {
            filename: imageFile.filename,
            objectURL: objectURL,
            blob: blob,
            arrayBuffer: arrayBuffer
        };
    }

    /**
     * 在指定容器中显示图片
     * @param {Array} imageDataArray - 图片数据数组
     * @param {HTMLElement} container - 图片容器元素
     */
    displayImages(imageDataArray, container) {
        if (!container) {
            console.error('图片容器未找到');
            return;
        }

        container.innerHTML = '';
        console.log(`开始显示 ${imageDataArray.length} 张图片`);

        imageDataArray.forEach((imageData, index) => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'comic-page';
            imgWrapper.dataset.filename = imageData.filename;
            imgWrapper.dataset.pageIndex = index;

            const img = document.createElement('img');
            img.src = imageData.objectURL;
            img.alt = `漫画页面 ${index + 1} - ${imageData.filename}`;
            img.loading = 'lazy'; // 懒加载提升性能

            // 添加加载错误处理
            img.onerror = () => {
                console.error(`图片加载失败: ${imageData.filename}`);
                img.alt = `图片加载失败: ${imageData.filename}`;
            };

            img.onload = () => {
                console.log(`图片加载成功: ${imageData.filename}`);
            };

            imgWrapper.appendChild(img);
            container.appendChild(imgWrapper);
        });
    }

    /**
     * 清理创建的Object URL，释放内存
     * @param {Array} imageDataArray - 图片数据数组
     */
    cleanup(imageDataArray) {
        if (imageDataArray) {
            imageDataArray.forEach(imageData => {
                if (imageData.objectURL) {
                    URL.revokeObjectURL(imageData.objectURL);
                    console.log('清理图片资源:', imageData.filename);
                }
            });
        }
    }
}

// 确保类在全局可用
console.log('ZipProcessor类定义完成');