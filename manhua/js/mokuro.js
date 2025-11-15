// mokuro.js - 解析Mokuro文件并在图片上创建文本层
class MokuroParser {
    constructor() {
        this.currentMokuroData = null;
        this.textBlocks = new Map(); // 存储文本块数据
        console.log('MokuroParser初始化完成');
    }

    /**
     * 解析Mokuro文件
     * @param {File} file - Mokuro文件
     * @returns {Promise<Object>} - 解析后的Mokuro数据
     */
    async parseMokuroFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    console.log('开始解析Mokuro文件');
                    const mokuroData = JSON.parse(e.target.result);
                    
                    // 验证Mokuro文件结构
                    if (!this.validateMokuroStructure(mokuroData)) {
                        throw new Error('无效的Mokuro文件格式');
                    }
                    
                    this.currentMokuroData = mokuroData;
                    this.processTextBlocks(mokuroData);
                    console.log('Mokuro文件解析成功');
                    resolve(mokuroData);
                } catch (error) {
                    console.error('Mokuro文件解析失败:', error);
                    reject(new Error(`Mokuro文件解析失败: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * 验证Mokuro文件结构
     * @param {Object} data - 待验证的Mokuro数据
     * @returns {boolean}
     */
    validateMokuroStructure(data) {
        return data && 
               data.version && 
               data.title && 
               Array.isArray(data.pages);
    }

    /**
     * 处理所有页面的文本块数据
     * @param {Object} mokuroData - Mokuro数据
     */
    processTextBlocks(mokuroData) {
        this.textBlocks.clear();
        
        mokuroData.pages.forEach(page => {
            const pageKey = page.img_path;
            this.textBlocks.set(pageKey, page.blocks || []);
        });
    }

    /**
     * 为指定图片创建文本层
     * @param {string} imagePath - 图片路径
     * @param {HTMLElement} imageElement - 图片DOM元素
     * @param {Object} options - 配置选项
     */
    createTextLayerForImage(imagePath, imageElement, options = {}) {
        const blocks = this.textBlocks.get(imagePath);
        if (!blocks || !imageElement.parentElement) {
            return null;
        }

        const defaultOptions = {
            showBoundingBox: true,
            enableHover: true,
            enableClick: true,
            hoverDisplay: 'tooltip' // 'tooltip' 或 'inline'
        };
        const config = { ...defaultOptions, ...options };

        // 创建文本层容器
        const textLayer = document.createElement('div');
        textLayer.className = 'mokuro-text-layer';
        
        const imgRect = imageElement.getBoundingClientRect();
        const scaleX = imgRect.width / imageElement.naturalWidth;
        const scaleY = imgRect.height / imageElement.naturalHeight;

        textLayer.style.position = 'absolute';
        textLayer.style.top = '0';
        textLayer.style.left = '0';
        textLayer.style.width = '100%';
        textLayer.style.height = '100%';
        textLayer.style.pointerEvents = 'none';

        // 为每个文本块创建元素
        blocks.forEach((block, index) => {
            const blockElement = this.createTextBlockElement(block, scaleX, scaleY, config, index);
            if (blockElement) {
                textLayer.appendChild(blockElement);
            }
        });

        // 将文本层添加到图片容器中
        const container = imageElement.parentElement;
        container.style.position = 'relative';
        container.appendChild(textLayer);

        return textLayer;
    }

    /**
     * 创建单个文本块元素
     * @param {Object} block - 文本块数据
     * @param {number} scaleX - X轴缩放比例
     * @param {number} scaleY - Y轴缩放比例
     * @param {Object} config - 配置对象
     * @param {number} index - 文本块索引
     * @returns {HTMLElement}
     */
    createTextBlockElement(block, scaleX, scaleY, config, index) {
        const [x1, y1, x2, y2] = block.box;
        
        const blockElement = document.createElement('div');
        blockElement.className = 'mokuro-text-block';
        blockElement.dataset.blockIndex = index;
        
        // 设置文本块位置和尺寸
        blockElement.style.position = 'absolute';
        blockElement.style.left = (x1 * scaleX) + 'px';
        blockElement.style.top = (y1 * scaleY) + 'px';
        blockElement.style.width = ((x2 - x1) * scaleX) + 'px';
        blockElement.style.height = ((y2 - y1) * scaleY) + 'px';
        blockElement.style.pointerEvents = 'auto';
        blockElement.style.cursor = 'pointer';

        // 可视化的边界框（调试用）
        if (config.showBoundingBox) {
            blockElement.style.border = '1px solid rgba(255, 0, 0, 0.3)';
            blockElement.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
        } else {
            blockElement.style.backgroundColor = 'transparent';
        }

        // 存储块数据供交互使用
        blockElement.dataset.blockData = JSON.stringify(block);

        // 添加交互事件
        this.attachBlockEvents(blockElement, block, config);

        return blockElement;
    }

    /**
     * 为文本块添加交互事件
     * @param {HTMLElement} blockElement - 文本块元素
     * @param {Object} blockData - 文本块数据
     * @param {Object} config - 配置对象
     */
    attachBlockEvents(blockElement, blockData, config) {
        if (config.enableHover) {
            blockElement.addEventListener('mouseenter', (e) => {
                this.handleBlockHover(e, blockData, config);
            });
            
            blockElement.addEventListener('mouseleave', (e) => {
                this.handleBlockHoverEnd(e, config);
            });
        }

        if (config.enableClick) {
            blockElement.addEventListener('click', (e) => {
                this.handleBlockClick(e, blockData);
            });
        }
    }

    /**
     * 处理文本块悬停事件
     * @param {Event} e - 事件对象
     * @param {Object} blockData - 文本块数据
     * @param {Object} config - 配置对象
     */
    handleBlockHover(e, blockData, config) {
        const textContent = blockData.lines.join(' ');
        
        if (config.hoverDisplay === 'tooltip') {
            this.showTooltip(e, textContent, blockData);
        } else {
            this.showInlinePreview(e.target, textContent);
        }
    }

    /**
     * 显示工具提示
     * @param {Event} e - 事件对象
     * @param {string} text - 要显示的文本
     * @param {Object} blockData - 文本块数据
     */
    showTooltip(e, text, blockData) {
        // 移除已存在的工具提示
        this.removeExistingTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'mokuro-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <strong>识别文本:</strong> ${text}
                <br><small>点击查看详细信息</small>
            </div>
        `;
        
        tooltip.style.position = 'fixed';
        tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.zIndex = '10000';
        tooltip.style.maxWidth = '300px';
        tooltip.style.fontSize = '14px';
        tooltip.style.pointerEvents = 'none';
        
        document.body.appendChild(tooltip);
        
        // 定位工具提示
        const x = e.clientX + 10;
        const y = e.clientY + 10;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        
        e.target.dataset.currentTooltip = 'true';
    }

    /**
     * 处理悬停结束事件
     */
    handleBlockHoverEnd(e, config) {
        if (config.hoverDisplay === 'tooltip') {
            this.removeExistingTooltip();
        } else {
            this.removeInlinePreview(e.target);
        }
    }

    /**
     * 移除已存在的工具提示
     */
    removeExistingTooltip() {
        const existingTooltip = document.querySelector('.mokuro-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    /**
     * 处理文本块点击事件
     * @param {Event} e - 事件对象
     * @param {Object} blockData - 文本块数据
     */
    handleBlockClick(e, blockData) {
        e.stopPropagation();
        
        // 创建详细信息模态框
        this.showDetailModal(blockData);
    }

    /**
     * 显示详细信息模态框
     * @param {Object} blockData - 文本块数据
     */
    showDetailModal(blockData) {
        // 移除已存在的模态框
        this.removeExistingModal();
        
        const modal = document.createElement('div');
        modal.className = 'mokuro-detail-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = 'white';
        modal.style.padding = '20px';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        modal.style.zIndex = '10001';
        modal.style.maxWidth = '90%';
        modal.style.maxHeight = '80%';
        modal.style.overflow = 'auto';
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3>文本块详细信息</h3>
                <button class="close-button" style="float: right; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            <div class="modal-content">
                <pre>${JSON.stringify(blockData, null, 2)}</pre>
            </div>
        `;
        
        // 关闭按钮事件
        modal.querySelector('.close-button').addEventListener('click', () => {
            this.removeExistingModal();
        });
        
        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.removeExistingModal();
            }
        });
        
        document.body.appendChild(modal);
    }

    /**
     * 移除已存在的模态框
     */
    removeExistingModal() {
        const existingModal = document.querySelector('.mokuro-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }
    }

    /**
     * 为所有页面创建文本层
     * @param {Object} mokuroData - Mokuro数据
     * @param {Object} options - 配置选项
     */
    createAllTextLayers(mokuroData, options = {}) {
        if (!mokuroData || !mokuroData.pages) {
            console.warn('没有可用的Mokuro数据');
            return;
        }

        mokuroData.pages.forEach(page => {
            const imageElement = this.findImageElementByPath(page.img_path);
            if (imageElement) {
                this.createTextLayerForImage(page.img_path, imageElement, options);
            }
        });
    }

    /**
     * 根据图片路径查找对应的DOM元素
     * @param {string} imagePath - 图片路径
     * @returns {HTMLElement|null}
     */
    findImageElementByPath(imagePath) {
        // 根据实际情况调整选择器
        const images = document.querySelectorAll('.comic-page img');
        for (const img of images) {
            if (img.src.includes(imagePath) || img.alt.includes(imagePath)) {
                return img;
            }
        }
        return null;
    }

    /**
     * 清理所有文本层
     */
    cleanup() {
        this.removeExistingTooltip();
        this.removeExistingModal();
        
        const textLayers = document.querySelectorAll('.mokuro-text-layer');
        textLayers.forEach(layer => layer.remove());
        
        this.textBlocks.clear();
        this.currentMokuroData = null;
    }
}

console.log('MokuroParser类定义完成');