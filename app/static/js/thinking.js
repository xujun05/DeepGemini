// 思考内容流式输出处理
class ThinkingHandler {
    constructor() {
        this.thinkingContent = null;
        this.isThinkingVisible = false;
        this.initialize();
    }

    initialize() {
        // 创建思考内容容器
        this.thinkingContent = document.createElement('div');
        this.thinkingContent.className = 'thinking-content collapsed';
        this.thinkingContent.style.whiteSpace = 'pre-wrap';

        // 创建切换按钮
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'btn btn-sm btn-outline-secondary mb-2 mt-1';
        this.toggleButton.textContent = '显示思考过程';
        this.toggleButton.style.display = 'none';
        this.toggleButton.addEventListener('click', () => this.toggleThinking());

        // 初始化标记解析器配置
        this.markedOptions = {
            gfm: true,
            breaks: true,
            sanitize: false,
            highlight: null // 禁用代码高亮
        };
    }

    // 处理思考内容更新
    handleThinking(thinking, messageContainer) {
        if (!thinking || thinking.trim() === '') return;
        
        if (!messageContainer.querySelector('.thinking-content')) {
            messageContainer.prepend(this.thinkingContent.cloneNode(true));
            messageContainer.prepend(this.toggleButton.cloneNode(true));
            
            // 获取刚添加的元素
            this.currentThinkingContent = messageContainer.querySelector('.thinking-content');
            this.currentToggleButton = messageContainer.querySelector('button');
            
            // 添加事件监听器
            this.currentToggleButton.addEventListener('click', () => {
                this.currentThinkingContent.classList.toggle('collapsed');
                // 切换后确保滚动条重置到顶部
                if (!this.currentThinkingContent.classList.contains('collapsed')) {
                    setTimeout(() => {
                        this.currentThinkingContent.scrollTop = 0;
                    }, 50);
                }
                this.currentToggleButton.textContent = 
                    this.currentThinkingContent.classList.contains('collapsed') 
                        ? '显示思考过程' 
                        : '隐藏思考过程';
            });
        }
        
        // 安全地渲染思考内容
        const sanitizedThinking = this.sanitizeAndFormatThinking(thinking);
        this.currentThinkingContent.innerHTML = sanitizedThinking;
        
        // 显示切换按钮
        this.currentToggleButton.style.display = 'inline-block';
    }

    // 处理并格式化思考内容
    sanitizeAndFormatThinking(thinking) {
        // 使用简单的转义处理，而不是完整的Markdown解析
        let formatted = thinking
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // 使用非贪婪匹配提取代码块
        formatted = formatted.replace(/```(.*?)\n([\s\S]*?)```/g, (match, language, code) => {
            // 对代码内容增加额外的处理，保留原始格式和缩进
            const processedCode = code
                .replace(/&lt;/g, '<span class="code-lt">&lt;</span>')
                .replace(/&gt;/g, '<span class="code-gt">&gt;</span>')
                .trim();
            
            // 使用更简单的包装，不依赖highlight.js
            return `<pre class="thinking-code-block"><code class="plain-code language-${language.trim()}">${processedCode}</code></pre>`;
        });

        // 基本的行内代码处理
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // 处理换行，但保留多个连续换行
        formatted = formatted.replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
        
        return formatted;
    }

    // 切换思考内容显示状态
    toggleThinking() {
        this.isThinkingVisible = !this.isThinkingVisible;
        if (this.currentThinkingContent) {
            this.currentThinkingContent.classList.toggle('collapsed', !this.isThinkingVisible);
            
            // 确保切换显示时滚动功能正常
            if (this.isThinkingVisible) {
                setTimeout(() => {
                    this.currentThinkingContent.scrollTop = 0;
                }, 50);
            }
            
            if (this.currentToggleButton) {
                this.currentToggleButton.textContent = this.isThinkingVisible 
                    ? '隐藏思考过程' 
                    : '显示思考过程';
            }
        }
    }

    // 重置状态
    reset() {
        this.isThinkingVisible = false;
        this.currentThinkingContent = null;
        this.currentToggleButton = null;
    }
}

// 创建全局思考处理器实例
const thinkingHandler = new ThinkingHandler(); 