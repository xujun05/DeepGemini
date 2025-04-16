// ChatLLM Interface Logic
// 全局变量来控制自动滚动
let autoScroll = true;

// 滚动到底部函数
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (autoScroll && chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else if (chatMessages) {
        // 显示滚动控制按钮
        const scrollControl = document.getElementById('scroll-control');
        if (scrollControl) {
            scrollControl.style.display = 'flex';
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
    /* 人类角色相关样式 */
    .human-message, .user {
        border-left: none;
        border-right: 4px solid #6c757d;
        background-color: rgba(0, 123, 255, 0.05);
        margin-left: auto;
        margin-right: 0;
        text-align: right;
        max-width: 80%;
        border-radius: 8px;
    }
    
    .ai {
        border-left: 4px solid #6c757d;
        border-right: none;
        background-color: rgba(108, 117, 125, 0.05);
        margin-left: 0;
        margin-right: auto;
        text-align: left;
        max-width: 80%;
        border-radius: 8px;
    }
    
    .message-container {
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;
        padding: 10px;
        border-radius: 8px;
    }
    
    .message-name {
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .user .message-name, .human-message .message-name {
        text-align: right;
    }
    
    .ai .message-name {
        text-align: left;
    }
    
    .human-badge {
        background-color: #007bff !important;
        color: white !important;
    }
    
    .waiting-human {
        border-left: 4px solid #ff9800;
        background-color: rgba(255, 152, 0, 0.05);
        font-style: italic;
    }
    
    #humanInputArea {
        border: 2px solid #007bff;
        padding: 15px;
        border-radius: 8px;
        background-color: rgba(0, 123, 255, 0.05);
        margin-top: 20px;
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.3);
        transition: all 0.3s ease;
    }
    
    #humanInputArea.d-none {
        display: none !important;
    }
    
    #humanRoleName {
        font-weight: bold;
        color: #007bff;
    }
    
    #humanInputMessage {
        border: 1px solid #007bff;
    }
    
    #sendHumanInput {
        background-color: #007bff;
        border-color: #007bff;
    }
    
    #sendHumanInput:hover {
        background-color: #0069d9;
        border-color: #0062cc;
    }
    
    /* 讨论组相关样式 */
    .discussion-topic {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #28a745;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .discussion-topic h3 {
        margin: 0;
        color: #28a745;
    }
    
    .agent-message {
        margin-bottom: 20px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        border-left: 4px solid #6c757d;
    }
    
    .agent-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
    }
    
    .agent-name {
        font-weight: bold;
        color: #495057;
    }
    
    .agent-badge {
        font-size: 0.75rem;
        padding: 3px 8px;
        border-radius: 12px;
        background-color: #6c757d;
        color: white;
    }
    
    .agent-content {
        padding: 15px;
        background-color: white;
        line-height: 1.6;
    }
    
    /* 思考内容折叠样式 */
    .thinking-container {
        margin-bottom: 10px;
        border-bottom: 1px dashed #ccc;
        padding-bottom: 10px;
        width: 100%;
        display: block;
    }
    
    .thinking-header {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
        color: #6c757d;
        font-size: 0.9rem;
        margin-bottom: 6px;
    }
    
    .thinking-header:hover {
        color: #495057;
    }
    
    .thinking-toggle-icon {
        margin-right: 6px;
        transition: transform 0.3s;
    }
    
    .thinking-toggle-icon.collapsed {
        transform: rotate(-90deg);
    }
    
    .thinking-content {
        background-color: #f8f9fa;
        border-radius: 4px;
        padding: 10px;
        font-size: 0.9rem;
        border-left: 3px solid #6c757d;
        overflow: hidden;
        transition: max-height 0.3s ease-out, opacity 0.3s ease;
        max-height: 600px;
        opacity: 1;
        width: 100%;
        box-sizing: border-box;
    }
    
    .thinking-content.collapsed {
        max-height: 0;
        padding: 0;
        border-width: 0;
        opacity: 0;
    }
    
    /* 确保消息容器中的元素垂直排列 */
    .message-container {
        display: flex;
        flex-direction: column;
    }
    
    /* 确保消息内容占据全宽 */
    .message-content {
        width: 100%;
        box-sizing: border-box;
    }
    
    /* 确保代理消息中的内容也是垂直排列 */
    .agent-message {
        display: flex;
        flex-direction: column;
    }
    
    .agent-content {
        width: 100%;
        box-sizing: border-box;
    }
    
    /* 暗色主题下的思考内容样式 */
    body.dark-theme .thinking-container {
        border-top: 1px dashed #555;
    }
    
    body.dark-theme .thinking-header {
        color: #adb5bd;
    }
    
    body.dark-theme .thinking-header:hover {
        color: #e9ecef;
    }
    
    body.dark-theme .thinking-content {
        background-color: #2d2d2d;
        border-left-color: #495057;
    }
    
    /* 聊天区域滚动控制 */
    #chat-messages {
        scroll-behavior: smooth;
        overflow-y: auto;
        height: calc(100vh - 200px);
    }
    
    /* 用于控制是否自动滚动的标志 */
    .auto-scroll-disabled {
        cursor: pointer;
    }
    
    /* 滚动控制按钮 */
    #scroll-control {
        position: fixed;
        bottom: 100px;
        right: 20px;
        background-color: rgba(0,0,0,0.5);
        color: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1000;
        opacity: 0.7;
        transition: opacity 0.3s;
    }
    
    #scroll-control:hover {
        opacity: 1;
    }
    
    /* 暗色主题适配 */
    body.dark-theme .user,
    body.dark-theme .human-message {
        background-color: rgba(0, 123, 255, 0.15);
    }
    
    body.dark-theme .ai {
        background-color: rgba(108, 117, 125, 0.15);
    }
    
    /* 总结消息特殊样式 */
    .summary-message {
        border-left: 4px solid #28a745;
        background-color: rgba(40, 167, 69, 0.05);
        margin-top: 30px;
    }
    
    .summary-message .agent-header {
        background-color: rgba(40, 167, 69, 0.1);
    }
    
    .summary-message .agent-name {
        color: #28a745;
    }
    
    .summary-message .agent-badge {
        background-color: #28a745;
    }
    
    .summary-message .agent-content {
        background-color: rgba(255, 255, 255, 0.7);
    }
    
    /* 轮次信息样式 */
    .round-info {
        margin-bottom: 15px;
        padding: 8px 12px;
        background-color: #f8f9fa;
        border-radius: 6px;
        font-size: 0.9rem;
        color: #6c757d;
        text-align: center;
    }
    
    .dark-round-info {
        background-color: #2d2d2d;
        color: #adb5bd;
    }
    
    /* 代码块样式 */
    .agent-content pre,
    .agent-content code {
        background-color: #f5f5f5;
        border-radius: 4px;
        padding: 0.2em 0.4em;
        font-size: 0.9em;
        border: 1px solid #e9ecef;
    }
    
    .agent-content pre {
        padding: 1em;
        overflow-x: auto;
    }
    
    .agent-content pre code {
        background-color: transparent;
        padding: 0;
        border: none;
    }
    
    .dark-code {
        background-color: #2c3e50 !important;
        color: #e74c3c !important;
        border-color: #34495e !important;
    }
    
    /* 讨论组暗色主题样式 */
    body.dark-theme .discussion-topic {
        background-color: #252525;
        border-left: 4px solid #2ecc71;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    body.dark-theme .discussion-topic h3 {
        color: #2ecc71;
    }
    
    body.dark-theme .agent-message {
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        border-left: 4px solid #6c757d;
    }
    
    body.dark-theme .agent-header {
        background-color: #2d2d2d;
        border-bottom: 1px solid #404040;
    }
    
    body.dark-theme .agent-name {
        color: #ecf0f1;
    }
    
    body.dark-theme .agent-badge {
        background-color: #555;
    }
    
    body.dark-theme .agent-content {
        background-color: #1e1e1e;
        color: #ecf0f1;
    }
    
    /* 总结消息暗色主题特殊样式 */
    body.dark-theme .summary-message {
        border-left: 4px solid #2ecc71;
        background-color: rgba(46, 204, 113, 0.1);
    }
    
    body.dark-theme .summary-message .agent-header {
        background-color: rgba(46, 204, 113, 0.15);
    }
    
    body.dark-theme .summary-message .agent-name {
        color: #2ecc71;
    }
    
    body.dark-theme .summary-message .agent-badge {
        background-color: #27ae60;
    }
    
    body.dark-theme .summary-message .agent-content {
        background-color: rgba(30, 30, 30, 0.8);
        color: #ecf0f1;
    }
    
    /* 黑暗模式下的代码块样式 */
    body.dark-theme .agent-content pre,
    body.dark-theme .agent-content code {
        background-color: #2c3e50;
        color: #e74c3c;
        border: 1px solid #34495e;
    }
    
    /* 黑暗模式下的超链接样式 */
    body.dark-theme .agent-content a {
        color: #3498db;
    }
    
    body.dark-theme .agent-content a:hover {
        color: #2980b9;
        text-decoration: underline;
    }
    
    .message-content {
        padding: 12px;
        font-size: 14px;
        line-height: 1.5;
        color: #333;
        white-space: pre-wrap;
        word-break: break-word;
    }
    
    .human-message .message-content, .user .message-content {
        text-align: right;
    }
    
    .ai .message-content {
        text-align: left;
    }
    
    .message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        margin-right: 12px;
        object-fit: cover;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
    
    .message-header {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
    }
    
    .user .message-header, .human-message .message-header {
        flex-direction: row-reverse;
        justify-content: flex-start;
    }
    
    .user .message-avatar, .human-message .message-avatar {
        margin-right: 0;
        margin-left: 12px;
    }
    
    .text-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 14px;
    }
    
    .ai-avatar {
        background-color: #007bff;
    }
    
    .user-avatar {
        background-color: #6c757d;
    }
    `;
    document.head.appendChild(style);

    // 全局变量
    let currentChatMode = "single"; // 默认为单模型对话
    let currentModelId = null;
    let currentRelayId = null;
    let currentRoleId = null;
    let currentGroupId = null;
    let currentMeetingId = null;
    let messageHistory = [];
    let humanRoles = [];
    let isWaitingForHumanInput = false;
    let defaultApiKey = 'sk-api-deepgemini-default';
    let humanCheckInterval = null;  // 添加人类输入检查定时器变量
    let waitingForHumanName = null;  // 添加跟踪当前等待输入的人类角色名称
    
    // DOM元素
    const chatModeRadios = document.querySelectorAll('input[name="chatMode"]');
    const settingSections = document.querySelectorAll('.chat-setting-section');
    const singleModelSelect = document.getElementById('singleModelSelect');
    const relayChainSelect = document.getElementById('relayChainSelect');
    const roleChatSelect = document.getElementById('roleChatSelect');
    const discussionGroupSelect = document.getElementById('discussionGroupSelect');
    const discussionTopic = document.getElementById('discussionTopic');
    const chatMessages = document.getElementById('chatMessages');
    const userMessage = document.getElementById('userMessage');
    const sendMessageBtn = document.getElementById('sendMessage');
    const humanInputArea = document.getElementById('humanInputArea');
    const humanRoleName = document.getElementById('humanRoleName');
    const humanInputMessage = document.getElementById('humanInputMessage');
    const sendHumanInputBtn = document.getElementById('sendHumanInput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // 创建并添加滚动控制按钮
    const scrollControl = document.createElement('div');
    scrollControl.id = 'scroll-control';
    scrollControl.innerHTML = '<i class="fas fa-arrow-down"></i>';
    scrollControl.style.display = 'none';
    document.body.appendChild(scrollControl);
    
    // 滚动控制按钮点击事件
    scrollControl.addEventListener('click', function() {
        console.log("滚动按钮被点击");
        autoScroll = true;
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
            this.style.display = 'none';
        }
    });
    
    // 监听聊天区域滚动事件
    if (chatMessages) {
        chatMessages.addEventListener('wheel', function() {
            // 检查是否已滚动到底部
            const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 50;
            autoScroll = isAtBottom;
            
            // 如果不在底部，显示滚动控制按钮
            scrollControl.style.display = isAtBottom ? 'none' : 'flex';
            console.log("滚动事件触发，自动滚动状态:", autoScroll);
        });
    }
    
    // 确保加载状态初始隐藏
    if (loadingSpinner) {
        loadingSpinner.classList.remove('show');
    }
    
    // 获取默认API密钥
    fetchDefaultApiKey();
    
    // 初始化
    init();
    
    // 监听主题切换
    document.addEventListener('themeChanged', function(e) {
        const isDarkMode = document.body.classList.contains('dark-theme');
        console.log(`主题切换: ${isDarkMode ? '暗色' : '亮色'}`);
        
        // 更新讨论组代码块样式
        const codeBlocks = document.querySelectorAll('.agent-content pre code');
        codeBlocks.forEach(block => {
            if (isDarkMode) {
                block.classList.add('dark-code');
            } else {
                block.classList.remove('dark-code');
            }
        });
        
        // 更新轮次信息样式
        const roundInfoElements = document.querySelectorAll('.round-info');
        roundInfoElements.forEach(el => {
            if (isDarkMode) {
                el.classList.add('dark-round-info');
            } else {
                el.classList.remove('dark-round-info');
            }
        });
    });
    
    // 初始检查主题并应用相应样式
    if (document.body.classList.contains('dark-theme')) {
        // 触发一次主题变化事件以应用样式
        document.dispatchEvent(new CustomEvent('themeChanged'));
    }
    
    // 事件监听
    chatModeRadios.forEach(radio => {
        radio.addEventListener('change', handleChatModeChange);
    });
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (userMessage) {
        userMessage.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    if (sendHumanInputBtn) {
        sendHumanInputBtn.addEventListener('click', sendHumanInput);
    }
    
    if (humanInputMessage) {
        humanInputMessage.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendHumanInput();
            }
        });
    }
    
    // 初始化函数
    async function init() {
        try {
            // 获取API密钥
            await fetchDefaultApiKey();
            
            // 配置marked使用highlight.js
            setupMarkedOptions();
            
            // 获取配置
            await Promise.all([
                loadModels(),
                loadConfigurations(),
                loadRoles(),
                loadGroups()
            ]);
            
            // 设置事件监听器
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                sendButton.addEventListener('click', sendMessage);
            }
            
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            }
            
            // 监听聊天模式切换
            const chatModeElement = document.getElementById('chatMode');
            if (chatModeElement) {
                chatModeElement.addEventListener('change', handleChatModeChange);
            
            // 初始设置活跃模式
                setActiveChatMode(chatModeElement.value);
            }
            
            // 设置讨论组选择的事件监听器
            if (discussionGroupSelect) {
                discussionGroupSelect.addEventListener('change', function() {
                    // 更新当前选中的讨论组ID
                    currentGroupId = this.value;
                    console.log('已选择讨论组:', currentGroupId);
                });
            }
            
            // 设置人类输入区域事件
            const humanSendButton = document.getElementById('sendHumanInput');
            if (humanSendButton) {
                humanSendButton.addEventListener('click', sendHumanInput);
            }
            
            const humanInputMessage = document.getElementById('humanInputMessage');
            if (humanInputMessage) {
                humanInputMessage.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendHumanInput();
                }
            });
            }
            
            // 设置重置按钮
            const resetButton = document.getElementById('resetButton');
            if (resetButton) {
                resetButton.addEventListener('click', resetChat);
            }
            
            // 隐藏加载提示
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // 设置定时器检查人类输入状态
            setInterval(checkForHumanInput, 3000); // 每3秒检查一次
            
            // 不再需要全局导出按钮
            const oldExportButton = document.getElementById('exportMarkdown');
            if (oldExportButton) {
                oldExportButton.remove(); // 移除旧的导出按钮
            }
            
            console.log('初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            showError('初始化失败: ' + error.message);
        }
    }
    
    // 处理聊天模式切换
    function handleChatModeChange(e) {
        const mode = e.target.value;
        setActiveChatMode(mode);
    }
    
    // 设置活动的聊天模式
    function setActiveChatMode(mode) {
        currentChatMode = mode;
        
        console.log('设置聊天模式:', mode);
        
        // 隐藏所有设置部分
        if (settingSections) {
            settingSections.forEach(section => {
                section.classList.add('d-none');
            });
        }
        
        // 根据不同的模式找到对应的设置区域ID
        let settingSectionId = null;
        
        switch(mode) {
            case 'single':
                settingSectionId = 'single-model-settings';
                break;
            case 'relay':
                settingSectionId = 'relay-chain-settings';
                break;
            case 'role':
                settingSectionId = 'role-chat-settings';
                break;
            case 'group':
                settingSectionId = 'discussion-group-settings';
                // 确保讨论组ID与选择器同步
                if (discussionGroupSelect && discussionGroupSelect.value) {
                    currentGroupId = discussionGroupSelect.value;
                    console.log('切换到讨论组模式，当前讨论组ID:', currentGroupId);
                }
                break;
        }
        
        console.log('要显示的设置区域ID:', settingSectionId);
        
        // 显示当前模式的设置
        const settingSection = document.getElementById(settingSectionId);
        
        if (settingSection) {
            settingSection.classList.remove('d-none');
            console.log('成功显示设置区域');
        } else {
            console.error('未找到设置区域:', settingSectionId);
        }
        
        // 重置聊天
        resetChat();
    }
    
    // 加载模型列表
    async function loadModels() {
        try {
            const response = await fetch('/v1/model_configs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // 保存模型信息到全局变量
            window.modelConfigs = {};
            data.forEach(model => {
                window.modelConfigs[model.id] = model;
            });
            
            // 填充单模型选择器
            if (singleModelSelect) {
                let options = '';
                data.forEach(model => {
                    // 标记reasoning类型模型
                    const modelType = model.type === 'reasoning' ? ' (思考型)' : '';
                    options += `<option value="${model.id}" data-type="${model.type || 'standard'}">${model.name}${modelType}</option>`;
                });
                
                singleModelSelect.innerHTML = options;
                
                // 设置默认值
                if (data.length > 0) {
                    currentModelId = data[0].id;
                }
            }
        } catch (error) {
            console.error('加载模型失败:', error);
        }
    }
    
    // 加载接力链配置
    async function loadConfigurations() {
        try {
            const response = await fetch('/v1/configurations');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // 填充接力链选择器
            if (relayChainSelect) {
                let options = '';
                data.forEach(config => {
                    options += `<option value="${config.id}">${config.name}</option>`;
                });
                
                relayChainSelect.innerHTML = options;
                
                // 设置默认值
                if (data.length > 0) {
                    currentRelayId = data[0].id;
                }
            }
        } catch (error) {
            console.error('加载接力链失败:', error);
        }
    }
    
    // 加载角色列表
    async function loadRoles() {
        try {
            const response = await fetch('/api/meeting/roles');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // 填充角色选择器
            if (roleChatSelect) {
                let options = '';
                data.forEach(role => {
                    options += `<option value="${role.id}">${role.name}</option>`;
                });
                
                roleChatSelect.innerHTML = options;
                
                // 设置默认值
                if (data.length > 0) {
                    currentRoleId = data[0].id;
                }
            }
        } catch (error) {
            console.error('加载角色失败:', error);
        }
    }
    
    // 加载讨论组列表
    async function loadGroups() {
        try {
            const response = await fetch('/api/meeting/groups');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // 填充讨论组选择器
            if (discussionGroupSelect) {
                let options = '';
                data.forEach(group => {
                    options += `<option value="${group.id}">${group.name}</option>`;
                });
                
                discussionGroupSelect.innerHTML = options;
                
                // 设置默认值
                if (data.length > 0) {
                    currentGroupId = data[0].id;
                    // 确保选择器实际显示选中的值
                    discussionGroupSelect.value = currentGroupId;
                    console.log('初始讨论组设置为:', currentGroupId);
                }
            }
        } catch (error) {
            console.error('加载讨论组失败:', error);
        }
    }
    
    // 发送消息
    async function sendMessage() {
        const message = userMessage.value.trim();
        if (!message) return;
        
        // 显示加载状态
        showLoading();
        
        // 添加用户消息到聊天区域
        addMessageToChat('user', message);
        userMessage.value = '';
        
        // 根据当前模式处理消息
        try {
            switch (currentChatMode) {
                case 'single':
                    await handleSingleModelChat(message);
                    break;
                case 'relay':
                    await handleRelayChainChat(message);
                    break;
                case 'role':
                    await handleRoleChat(message);
                    break;
                case 'group':
                    await handleGroupChat(message);
                    break;
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            addMessageToChat('system', '发送消息失败: ' + error.message);
        } finally {
            // 隐藏加载状态
            hideLoading();
        }
    }
    
    // 处理单模型对话
    async function handleSingleModelChat(message) {
        const modelId = singleModelSelect.value;
        
        // 检查模型类型
        const modelConfig = window.modelConfigs?.[modelId] || {};
        const isReasoningModel = modelConfig.type === 'reasoning';
        
        // 构建消息历史
        const messages = buildChatMessages(message);
        
        // 获取API密钥 - 使用默认或从localStorage获取
        const apiKey = getCurrentApiKey();
        
        try {
            // 使用流式响应处理
            const response = await fetch('/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}` // 添加API密钥到请求头
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: true // 默认启用流式响应
                })
            });
            
            // 处理响应状态
            if (!response.ok) {
                // 当状态码不是2xx时
                if (response.status === 401) {
                    throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
                } else {
                    throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
                }
            }
            
            // 创建消息容器
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', 'ai');
            
            // 创建思考内容容器（初始为折叠状态）
            const thinkingContainer = document.createElement('div');
            thinkingContainer.classList.add('thinking-container');
            
            // 只有reasoning类型模型才显示思考过程
            if (!isReasoningModel) {
                thinkingContainer.style.display = 'none';
            }
            
            const thinkingHeader = document.createElement('div');
            thinkingHeader.classList.add('thinking-header');
            thinkingHeader.innerHTML = '<span class="thinking-toggle-icon">▼</span>查看思考过程';
            
            const thinkingContent = document.createElement('div');
            thinkingContent.classList.add('thinking-content');
            
            // 默认折叠
            thinkingHeader.querySelector('.thinking-toggle-icon').classList.add('collapsed');
            thinkingContent.classList.add('collapsed');
            
            // 添加切换折叠功能
            thinkingHeader.addEventListener('click', () => {
                const icon = thinkingHeader.querySelector('.thinking-toggle-icon');
                icon.classList.toggle('collapsed');
                thinkingContent.classList.toggle('collapsed');
            });
            
            thinkingContainer.appendChild(thinkingHeader);
            thinkingContainer.appendChild(thinkingContent);
            
            // 创建常规消息内容容器
            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            
            // 先添加思考容器，后添加内容容器（思考在上，回答在下）
            messageContainer.appendChild(thinkingContainer);
            messageContainer.appendChild(messageContent);
            chatMessages.appendChild(messageContainer);
            
            // 滚动到底部
            scrollToBottom();
            
            // 保存完整响应内容
            let fullContent = '';
            let thinkingContentText = '';
            let hasThinkingContent = false;
            
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 解码并处理数据块
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                                const delta = data.choices[0].delta;
                                
                                // 处理普通内容
                                if (delta.content) {
                                    fullContent += delta.content;
                                    messageContent.innerHTML = marked.parse(fullContent);
                                }
                                
                                // 处理思考内容，但只在reasoning模型中显示
                                if (delta.reasoning_content || delta.hasOwnProperty('reasoning_content')) {
                                    hasThinkingContent = true;
                                    thinkingContentText += delta.reasoning_content || '';
                                    
                                    // 使用自定义函数更安全地更新思考内容而不破坏正在进行的渲染
                                    updateThinkingContent(thinkingContent, thinkingContentText);
                                    
                                    // 如果有思考内容且是reasoning模型，显示思考容器
                                    if (isReasoningModel) {
                                        thinkingContainer.style.display = 'block';
                                    }
                                }
                                
                                // 滚动到底部
                                scrollToBottom();
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    }
                }
            }
            
            // 如果没有思考内容，隐藏思考容器
            if (!hasThinkingContent || !isReasoningModel) {
                thinkingContainer.style.display = 'none';
            }
            
            // 添加导出按钮到AI消息
            addExportButtonToMessage(messageContainer);
            
            // 更新消息历史
            messageHistory.push({ role: 'user', content: message });
            messageHistory.push({ 
                role: 'assistant', 
                content: fullContent,
                reasoning_content: hasThinkingContent ? thinkingContentText : '' 
            });
            
            return fullContent;
        } catch (error) {
            console.error('流式请求失败，回退到普通请求:', error);
            
            // 回退到非流式请求
            const fallbackResponse = await fetch('/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: false
                })
            });
            
            if (!fallbackResponse.ok) {
                if (fallbackResponse.status === 401) {
                    throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
                } else {
                    throw new Error(`服务器错误: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
                }
            }
            
            const data = await fallbackResponse.json();
            
            if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                const reasoningContent = data.choices[0].message.reasoning_content;
                
                // 添加带思考内容的消息
                const messageId = addMessageToChat('ai', aiMessage);
                
                // 如果有思考内容，添加思考容器
                if (reasoningContent) {
                    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (messageElement) {
                        // 清空现有内容以便重新排序
                        messageElement.innerHTML = '';
                        
                        // 创建思考容器
                        const thinkingContainer = document.createElement('div');
                        thinkingContainer.classList.add('thinking-container');
                        
                        const thinkingHeader = document.createElement('div');
                        thinkingHeader.classList.add('thinking-header');
                        thinkingHeader.innerHTML = '<span class="thinking-toggle-icon">▼</span>查看思考过程';
                        
                        const thinkingContent = document.createElement('div');
                        thinkingContent.classList.add('thinking-content');
                        
                        // 使用安全的方式更新思考内容
                        updateThinkingContent(thinkingContent, reasoningContent);
                        
                        // 默认折叠
                        thinkingHeader.querySelector('.thinking-toggle-icon').classList.add('collapsed');
                        thinkingContent.classList.add('collapsed');
                        
                        // 添加切换折叠功能
                        thinkingHeader.addEventListener('click', () => {
                            const icon = thinkingHeader.querySelector('.thinking-toggle-icon');
                            icon.classList.toggle('collapsed');
                            thinkingContent.classList.toggle('collapsed');
                        });
                        
                        // 创建常规内容容器
                        const messageContent = document.createElement('div');
                        messageContent.classList.add('message-content');
                        messageContent.innerHTML = marked.parse(aiMessage);
                        
                        // 先添加思考再添加内容（思考在上，回答在下）
                        thinkingContainer.appendChild(thinkingHeader);
                        thinkingContainer.appendChild(thinkingContent);
                        messageElement.appendChild(thinkingContainer);
                        messageElement.appendChild(messageContent);
                        
                        // 添加导出按钮
                        addExportButtonToMessage(messageElement);
                    }
                }
                
                // 更新消息历史
                messageHistory.push({ role: 'user', content: message });
                messageHistory.push({ 
                    role: 'assistant', 
                    content: aiMessage,
                    reasoning_content: reasoningContent || ''
                });
                
                return aiMessage;
            } else {
                throw new Error('未收到有效响应');
            }
        }
    }
    
    // 处理接力链对话
    async function handleRelayChainChat(message) {
        const configId = relayChainSelect.value;
        // 初始化extractedMeetingId变量
        let extractedMeetingId = null;
        
        // 构建消息历史
        const messages = buildChatMessages(message);
        
        // 获取API密钥 - 使用默认或从localStorage获取
        const apiKey = getCurrentApiKey();
        
        try {
            // 获取配置详情以提取配置名称
            const configResponse = await fetch(`/v1/configurations/${configId}`);
            let configName = configId;  // 默认使用ID
            
            if (configResponse.ok) {
                const configData = await configResponse.json();
                configName = configData.name;  // 使用配置名称
                console.log(`使用配置名称发送请求: ${configName}`);
            } else {
                console.warn(`无法获取配置信息，将使用配置ID: ${configId}`);
            }
            
            // 使用流式响应处理
            const response = await fetch('/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}` // 添加API密钥到请求头
                },
                body: JSON.stringify({
                    model: configName,  // 使用配置名称而不是ID
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: true // 默认启用流式响应
                })
            });
            
            // 处理响应状态
            if (!response.ok) {
                // 当状态码不是2xx时
                if (response.status === 401) {
                    throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
                } else {
                    throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
                }
            }
            
            // 创建初始消息容器（如果没有特定发言人，将使用此容器）
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', 'ai');
            
            // 为AI消息添加导出按钮
            addExportButtonToMessage(messageContainer);
            
            // 创建思考内容容器（初始为折叠状态）
            const thinkingContainer = document.createElement('div');
            thinkingContainer.classList.add('thinking-container');
            thinkingContainer.style.display = 'none'; // 默认隐藏
            
            const thinkingHeader = document.createElement('div');
            thinkingHeader.classList.add('thinking-header');
            thinkingHeader.innerHTML = '<span class="thinking-toggle-icon">▼</span>查看思考过程';
            
            const thinkingContent = document.createElement('div');
            thinkingContent.classList.add('thinking-content');
            
            // 默认折叠
            thinkingHeader.querySelector('.thinking-toggle-icon').classList.add('collapsed');
            thinkingContent.classList.add('collapsed');
            
            // 添加切换折叠功能
            thinkingHeader.addEventListener('click', () => {
                const icon = thinkingHeader.querySelector('.thinking-toggle-icon');
                icon.classList.toggle('collapsed');
                thinkingContent.classList.toggle('collapsed');
            });
            
            thinkingContainer.appendChild(thinkingHeader);
            thinkingContainer.appendChild(thinkingContent);
            
            // 创建常规消息内容容器
            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            
            // 先添加思考容器再添加常规内容容器
            messageContainer.appendChild(thinkingContainer);
            messageContainer.appendChild(messageContent);
            chatMessages.appendChild(messageContainer);
            
            // 滚动到底部
            scrollToBottom();
            
            // 保存完整响应内容
            let fullContent = '';
            let thinkingContentText = '';
            let hasThinkingContent = false;
            
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let currentSpeaker = null;
            let speakerContent = '';
            let speakerThinkingContent = '';
            let speakerContainer = null;
            let speakerContentElement = null;
            let speakerThinkingContainer = null;
            
            // 定期检查是否需要人类输入的定时器
            let humanCheckInterval = null;
            
            let hasSpecialFormat = false; // 跟踪是否检测到特殊格式（发言人格式或其他特殊标记）
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    // 尝试从响应中提取会议ID（如果有）
                    if (!extractedMeetingId && line.includes("meeting_id")) {
                        try {
                            const match = line.match(/"meeting_id":\s*"([^"]+)"/);
                            if (match && match[1]) {
                                extractedMeetingId = match[1];
                                console.log("从响应中提取到会议ID:", extractedMeetingId);
                                currentMeetingId = extractedMeetingId;
                                
                                // 加载该会议中的人类角色
                                await loadHumanRoles();
                                
                                // 设置定时器检查是否需要人类输入
                                if (humanCheckInterval) {
                                    clearInterval(humanCheckInterval);
                                }
                                // 不再设置循环检查的定时器，改为只在需要时检查
                                // humanCheckInterval = setInterval(checkForHumanInput, 2000); // 每2秒检查一次
                            }
                        } catch (e) {
                            console.error("提取会议ID时出错:", e);
                        }
                    }
                    
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            // 解析SSE数据
                            const data = JSON.parse(line.substring(6));
                            
                            // 检查是否有内容更新
                            if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                                const delta = data.choices[0].delta;
                                const content = delta.content || '';
                                const reasoningContent = delta.reasoning_content || '';
                                
                                // 检查是否有新发言人标记 "### 名称 发言："
                                const speakerMatch = content.match(/###\s+(.+?)\s+发言：/);
                                
                                if (speakerMatch) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    // 如果有之前的发言者，保存之前的内容
                                    if (currentSpeaker && speakerContent.trim()) {
                                        // 添加内容到UI
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        }
                                    }
                                    
                                    // 新发言人开始
                                    currentSpeaker = speakerMatch[1];
                                    speakerContent = '';
                                    speakerThinkingContent = '';
                                    
                                    // 检查是否是人类角色
                                    const isHumanRole = humanRoles.some(role => role.name === currentSpeaker);
                                    
                                    // 如果是人类角色，提前检查是否需要等待输入
                                    if (isHumanRole) {
                                        console.log(`检测到人类角色 ${currentSpeaker} 即将发言`);
                                        
                                        // 创建新的发言容器，但标记为等待状态
                                        speakerContainer = document.createElement('div');
                                        speakerContainer.classList.add('agent-message', 'human-message', 'waiting-human');
                                        
                                        const speakerHeader = document.createElement('div');
                                        speakerHeader.classList.add('agent-header');
                                        
                                        const speakerNameElement = document.createElement('div');
                                        speakerNameElement.classList.add('agent-name');
                                        speakerNameElement.textContent = currentSpeaker;
                                        
                                        const speakerBadge = document.createElement('div');
                                        speakerBadge.classList.add('agent-badge', 'human-badge');
                                        speakerBadge.textContent = '人类';
                                        
                                        speakerHeader.appendChild(speakerNameElement);
                                        speakerHeader.appendChild(speakerBadge);
                                        
                                        speakerContentElement = document.createElement('div');
                                        speakerContentElement.classList.add('agent-content');
                                        speakerContentElement.textContent = "等待人类输入...";
                                        
                                        speakerContainer.appendChild(speakerHeader);
                                        speakerContainer.appendChild(speakerContentElement);
                                        
                                        chatMessages.appendChild(speakerContainer);
                                        
                                        // 立即检查人类输入
                                        humanRoleName.textContent = currentSpeaker;
                                        await checkForHumanInput();
                                        
                                        // 如果仍然未显示人类输入区域，则强制显示
                                        if (humanInputArea.classList.contains('d-none')) {
                                            console.log(`强制显示人类输入区域给 ${currentSpeaker}`);
                                            isWaitingForHumanInput = true;
                                            humanInputArea.classList.remove('d-none');
                                            document.querySelector('.chat-input').classList.add('d-none');
                                            
                                            // 添加提示消息
                                            // addMessageToChat('system', `轮到 ${currentSpeaker} (人类角色) 发言，请输入您的发言内容`);
                                            
                                            // 聚焦到输入框
                                            humanInputMessage.focus();
                                        }
                                    } else {
                                        // 创建新的发言容器
                                        speakerContainer = document.createElement('div');
                                        speakerContainer.classList.add('agent-message');
                                        speakerContainer.style.display = 'flex';
                                        speakerContainer.style.flexDirection = 'column';
                                        
                                        const speakerHeader = document.createElement('div');
                                        speakerHeader.classList.add('agent-header');
                                        
                                        const speakerNameElement = document.createElement('div');
                                        speakerNameElement.classList.add('agent-name');
                                        speakerNameElement.textContent = currentSpeaker;
                                        
                                        const speakerBadge = document.createElement('div');
                                        speakerBadge.classList.add('agent-badge');
                                        speakerBadge.textContent = 'AI';
                                        
                                        speakerHeader.appendChild(speakerNameElement);
                                        speakerHeader.appendChild(speakerBadge);
                                        
                                        // 创建思考内容容器（先创建）
                                        speakerThinkingContainer = document.createElement('div');
                                        speakerThinkingContainer.classList.add('thinking-container');
                                        speakerThinkingContainer.style.display = 'none'; // 默认隐藏
                                        speakerThinkingContainer.style.width = '100%';
                                        
                                        const thinkingHeader = document.createElement('div');
                                        thinkingHeader.classList.add('thinking-header');
                                        thinkingHeader.innerHTML = '<span class="thinking-toggle-icon">▼</span>查看思考过程';
                                        
                                        const thinkingContent = document.createElement('div');
                                        thinkingContent.classList.add('thinking-content');
                                        
                                        // 默认折叠
                                        thinkingHeader.querySelector('.thinking-toggle-icon').classList.add('collapsed');
                                        thinkingContent.classList.add('collapsed');
                                        
                                        // 添加切换折叠功能
                                        thinkingHeader.addEventListener('click', () => {
                                            const icon = thinkingHeader.querySelector('.thinking-toggle-icon');
                                            icon.classList.toggle('collapsed');
                                            thinkingContent.classList.toggle('collapsed');
                                        });
                                        
                                        speakerThinkingContainer.appendChild(thinkingHeader);
                                        speakerThinkingContainer.appendChild(thinkingContent);
                                        
                                        // 创建内容元素（后创建）
                                        speakerContentElement = document.createElement('div');
                                        speakerContentElement.classList.add('agent-content');
                                        speakerContentElement.style.width = '100%';
                                        
                                        // 先添加思考容器再添加内容（思考在上，回答在下）
                                        speakerContainer.appendChild(speakerHeader);
                                        speakerContainer.appendChild(speakerThinkingContainer);
                                        speakerContainer.appendChild(speakerContentElement);
                                        
                                        chatMessages.appendChild(speakerContainer);
                                    }
                                } 
                                // 检查是否有会议结束和总结标记
                                else if (content.includes("## 会议结束") || content.includes("会议总结") || content.includes("## 会议总结")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到会议结束或总结标记: ", content);
                                    
                                    // 如果有之前的发言者，保存之前的内容
                                    if (currentSpeaker && speakerContent.trim()) {
                                        // 添加内容到UI
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        }
                                    }
                                    
                                    // 创建总结发言人
                                    currentSpeaker = "总结";
                                    speakerContent = content;  // 先添加当前delta到内容中
                                    
                                    // 查找已经存在的总结消息
                                    const existingSummaries = document.querySelectorAll('.summary-message');
                                    if (existingSummaries.length > 0) {
                                        // 如果已经存在总结容器，使用它
                                        speakerContainer = existingSummaries[0];
                                        speakerContentElement = speakerContainer.querySelector('.agent-content');
                                        if (!speakerContentElement) {
                                            speakerContentElement = document.createElement('div');
                                            speakerContentElement.classList.add('agent-content');
                                            speakerContentElement.style.width = '100%';
                                            speakerContainer.appendChild(speakerContentElement);
                                        }
                                        console.log("使用已存在的总结容器");
                                    } else {
                                        // 创建新的发言容器
                                        speakerContainer = document.createElement('div');
                                        speakerContainer.classList.add('agent-message', 'summary-message');
                                        speakerContainer.style.display = 'flex';
                                        speakerContainer.style.flexDirection = 'column';
                                        
                                        const speakerHeader = document.createElement('div');
                                        speakerHeader.classList.add('agent-header');
                                        
                                        const speakerNameElement = document.createElement('div');
                                        speakerNameElement.classList.add('agent-name');
                                        speakerNameElement.textContent = "会议总结";
                                        
                                        const speakerBadge = document.createElement('div');
                                        speakerBadge.classList.add('agent-badge');
                                        speakerBadge.textContent = 'AI';
                                        
                                        speakerHeader.appendChild(speakerNameElement);
                                        speakerHeader.appendChild(speakerBadge);
                                        
                                        speakerContentElement = document.createElement('div');
                                        speakerContentElement.classList.add('agent-content');
                                        speakerContentElement.style.width = '100%';
                                        
                                        speakerContainer.appendChild(speakerHeader);
                                        speakerContainer.appendChild(speakerContentElement);
                                        
                                        chatMessages.appendChild(speakerContainer);
                                        console.log("创建了新的总结容器");
                                    }
                                    
                                    // 确保总结标题显示在顶部
                                    speakerContentElement.innerHTML = marked.parse(speakerContent);
                                    
                                    // 清除检查人类输入的定时器
                                    if (humanCheckInterval) {
                                        clearInterval(humanCheckInterval);
                                        humanCheckInterval = null;
                                    }
                                    
                                    // 设置会议为已结束状态
                                    if (currentMeetingId) {
                                        console.log("会议已结束，清除会议ID");
                                        currentMeetingId = null;
                                    }
                                    
                                    // 滚动到底部
                                    scrollToBottom();
                                }
                                // 当已经在显示总结内容时，继续累积总结内容
                                else if (currentSpeaker === "总结") {
                                    console.log("正在累积总结内容: " + content.substring(0, 30) + (content.length > 30 ? "..." : ""));
                                    speakerContent += content;
                                    
                                    // 更新总结内容
                                    if (speakerContentElement) {
                                        speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        // 滚动到底部
                                        scrollToBottom();
                                    }
                                } 
                                // 检查"等待人类输入"标记
                                else if (content.includes("等待人类输入") || content.includes("waiting for human input")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到等待人类输入的提示");
                                    // 立即检查人类输入状态
                                    await checkForHumanInput();
                                } 
                                // 处理思考内容
                                else if (reasoningContent) {
                                    hasThinkingContent = true;
                                    
                                    if (currentSpeaker) {
                                        // 处理特定发言人的思考内容
                                        speakerThinkingContent += reasoningContent;
                                        
                                        // 更新思考内容
                                        if (speakerThinkingContainer) {
                                            // 显示思考容器
                                            speakerThinkingContainer.style.display = 'block';
                                            
                                            const thinkingContentElement = speakerThinkingContainer.querySelector('.thinking-content');
                                            if (thinkingContentElement) {
                                                thinkingContentElement.innerHTML = marked.parse(speakerThinkingContent);
                                            }
                                        }
                                    } else {
                                        // 处理通用思考内容
                                        thinkingContentText += reasoningContent;
                                        thinkingContent.innerHTML = marked.parse(thinkingContentText);
                                        
                                        // 显示思考容器
                                        thinkingContainer.style.display = 'block';
                                    }
                                }
                                // 处理其他类型的响应...
                                else {
                                    // 处理常规内容更新、总结内容等现有逻辑
                                    if (content) {
                                        if (currentSpeaker) {
                                            speakerContent += content;
                                            if (speakerContentElement) {
                                                speakerContentElement.innerHTML = marked.parse(speakerContent);
                                            }
                                        } else {
                                            fullContent += content;
                                            messageContent.innerHTML = marked.parse(fullContent);
                                        }
                                    }
                                }
                                
                                // 滚动到底部
                                scrollToBottom();
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    } else if (line === 'data: [DONE]') {
                        console.log('讨论完成');
                        
                        // 清理定时刷新
                        if (window.refreshTimer) {
                            clearTimeout(window.refreshTimer);
                            window.refreshTimer = null;
                            console.log("已清理会议刷新定时器");
                        }
                        
                        // 流结束后，检查一次是否需要人类输入
                        await checkForHumanInput();
                    }
                }
            }
            
            // 隐藏加载状态
            hideLoading();
            
            return true;
        } catch (error) {
            console.error('创建讨论失败:', error);
            hideLoading();
            showError(`创建讨论失败: ${error.message}`);
            return false;
        }
    }
    
    // 处理角色对话
    async function handleRoleChat(message) {
        const roleId = roleChatSelect.value;
        
        // 获取API密钥 - 使用默认或从localStorage获取
        const apiKey = getCurrentApiKey();
        
        try {
            // 使用流式响应处理
            const response = await fetch('/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}` // 添加API密钥到请求头
                },
                body: JSON.stringify({
                    model: `role-${roleId}`,
                    messages: [...messageHistory, { role: 'user', content: message }],
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: true // 默认启用流式响应
                })
            });
            
            // 处理响应状态
            if (!response.ok) {
                // 当状态码不是2xx时
                if (response.status === 401) {
                    throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
                } else {
                    throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
                }
            }
            
            // 创建消息容器
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', 'ai');
            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            messageContainer.appendChild(messageContent);
            chatMessages.appendChild(messageContainer);
            
            // 为AI消息添加导出按钮
            addExportButtonToMessage(messageContainer);
            
            // 创建思考内容容器（初始为折叠状态）
            const thinkingContainer = document.createElement('div');
            thinkingContainer.classList.add('thinking-container');
            
            const thinkingHeader = document.createElement('div');
            thinkingHeader.classList.add('thinking-header');
            thinkingHeader.innerHTML = '<span class="thinking-toggle-icon">▼</span>查看思考过程';
            
            const thinkingContent = document.createElement('div');
            thinkingContent.classList.add('thinking-content');
            
            // 默认折叠
            thinkingHeader.querySelector('.thinking-toggle-icon').classList.add('collapsed');
            thinkingContent.classList.add('collapsed');
            
            // 添加切换折叠功能
            thinkingHeader.addEventListener('click', () => {
                const icon = thinkingHeader.querySelector('.thinking-toggle-icon');
                icon.classList.toggle('collapsed');
                thinkingContent.classList.toggle('collapsed');
            });
            
            thinkingContainer.appendChild(thinkingHeader);
            thinkingContainer.appendChild(thinkingContent);
            
            // 滚动到底部
            scrollToBottom();
            
            // 保存完整响应内容
            let fullContent = '';
            let thinkingContentText = '';
            let hasThinkingContent = false;
            
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 解码并处理数据块
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                                const delta = data.choices[0].delta;
                                
                                // 处理普通内容
                                if (delta.content) {
                                    fullContent += delta.content;
                                    messageContent.innerHTML = marked.parse(fullContent);
                                }
                                
                                // 处理思考内容
                                if (delta.reasoning_content || delta.hasOwnProperty('reasoning_content')) {
                                    hasThinkingContent = true;
                                    thinkingContentText += delta.reasoning_content || '';
                                    thinkingContent.innerHTML = marked.parse(thinkingContentText);
                                    
                                    // 如果是第一次出现思考内容，添加思考容器到DOM
                                    if (!messageContainer.contains(thinkingContainer)) {
                                        messageContainer.appendChild(thinkingContainer);
                                    }
                                }
                                
                                // 滚动到底部
                                scrollToBottom();
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    }
                }
            }
            
            // 如果没有思考内容，移除思考容器
            if (!hasThinkingContent && messageContainer.contains(thinkingContainer)) {
                messageContainer.removeChild(thinkingContainer);
            }
            
            // 更新消息历史
            messageHistory.push({ role: 'user', content: message });
            messageHistory.push({ 
                role: 'assistant', 
                content: fullContent,
                reasoning_content: hasThinkingContent ? thinkingContentText : '' 
            });
            
            return fullContent;
        } catch (error) {
            console.error('流式请求失败，回退到普通请求:', error);
            
            // 回退到非流式请求
            const fallbackResponse = await fetch('/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}`
                },
                body: JSON.stringify({
                    model: `role-${roleId}`,
                    messages: [...messageHistory, { role: 'user', content: message }],
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: false
                })
            });
            
            if (!fallbackResponse.ok) {
                if (fallbackResponse.status === 401) {
                    throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
                } else {
                    throw new Error(`服务器错误: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
                }
            }
            
            const data = await fallbackResponse.json();
            
            if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                const reasoningContent = data.choices[0].message.reasoning_content;
                
                // 添加带思考内容的消息
                const messageId = addMessageToChat('ai', aiMessage);
                
                // 如果有思考内容，添加思考容器
                if (reasoningContent) {
                    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (messageElement) {
                        // 清空现有内容以便重新排序
                        messageElement.innerHTML = '';
                        
                        // 创建思考容器
                        const thinkingContainer = document.createElement('div');
                        thinkingContainer.classList.add('thinking-container');
                        
                        const thinkingHeader = document.createElement('div');
                        thinkingHeader.classList.add('thinking-header');
                        thinkingHeader.innerHTML = '<span class="thinking-toggle-icon">▼</span>查看思考过程';
                        
                        const thinkingContent = document.createElement('div');
                        thinkingContent.classList.add('thinking-content');
                        
                        // 使用安全的方式更新思考内容
                        updateThinkingContent(thinkingContent, reasoningContent);
                        
                        // 默认折叠
                        thinkingHeader.querySelector('.thinking-toggle-icon').classList.add('collapsed');
                        thinkingContent.classList.add('collapsed');
                        
                        // 添加切换折叠功能
                        thinkingHeader.addEventListener('click', () => {
                            const icon = thinkingHeader.querySelector('.thinking-toggle-icon');
                            icon.classList.toggle('collapsed');
                            thinkingContent.classList.toggle('collapsed');
                        });
                        
                        // 创建常规内容容器
                        const messageContent = document.createElement('div');
                        messageContent.classList.add('message-content');
                        messageContent.innerHTML = marked.parse(aiMessage);
                        
                        // 先添加思考再添加内容（思考在上，回答在下）
                        thinkingContainer.appendChild(thinkingHeader);
                        thinkingContainer.appendChild(thinkingContent);
                        messageElement.appendChild(thinkingContainer);
                        messageElement.appendChild(messageContent);
                        
                        // 添加导出按钮
                        addExportButtonToMessage(messageElement);
                    }
                }
                
                // 更新消息历史
                messageHistory.push({ role: 'user', content: message });
                messageHistory.push({ 
                    role: 'assistant', 
                    content: aiMessage,
                    reasoning_content: reasoningContent || ''
                });
                
                return aiMessage;
            } else {
                throw new Error('未收到有效响应');
            }
        }
    }
    
    // 处理讨论组对话
    async function handleGroupChat(message) {
        try {
            // 记录当前使用的讨论组ID
            console.log('开始讨论组对话，当前选中的讨论组ID:', currentGroupId);
            console.log('讨论组选择器当前值:', discussionGroupSelect.value);
            
            // 确保讨论组ID与选择器一致
            if (currentGroupId !== discussionGroupSelect.value) {
                console.log('检测到讨论组ID不一致，更新为当前选择的值');
                currentGroupId = discussionGroupSelect.value;
            }
            
            if (!currentGroupId) {
                showError('请先选择讨论组');
                return false;
            }
            
            if (!discussionTopic.value.trim()) {
                showError('请输入讨论主题');
                return false;
            }
            
            // 显示加载状态
            showLoading();
            
            // 获取API密钥
        const apiKey = getCurrentApiKey();
        
            // 清空消息区域
            chatMessages.innerHTML = '';
            
            // 添加主题头部
            const topicEl = document.createElement('div');
            topicEl.classList.add('discussion-topic');
            topicEl.innerHTML = `<h3>讨论主题: ${discussionTopic.value.trim()}</h3>`;
            chatMessages.appendChild(topicEl);
            
            // 使用OpenAI兼容API进行流式请求
            const response = await fetch('/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    'Authorization': `${apiKey}`
                    },
                    body: JSON.stringify({
                    model: `group-${currentGroupId}`,
                    messages: [{ role: 'user', content: discussionTopic.value.trim() }],
                    stream: true
                    })
                });
                
            if (!response.ok) {
                throw new Error(`讨论创建失败: ${response.status} ${response.statusText}`);
            }
            
            // 获取会议ID - 从响应头中提取
            const meetingIdHeader = response.headers.get('X-Meeting-Id');
            if (meetingIdHeader) {
                currentMeetingId = meetingIdHeader;
                console.log("从响应头获取到会议ID:", currentMeetingId);
                
                // 加载该会议中的人类角色
                await loadHumanRoles();
            }
            
            // 处理SSE流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let currentSpeaker = null;
            let speakerContent = '';
            let speakerThinkingContent = '';
            let speakerContainer = null;
            let speakerContentElement = null;
            let speakerThinkingContainer = null;
            
            let hasSpecialFormat = false; // 跟踪是否检测到特殊格式
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // 如果流结束，检查会议是否已结束
                    console.log("流结束，检查会议状态");
                    if (currentMeetingId) {
                        try {
                            const statusResponse = await fetch(`/api/meeting/discussions/${currentMeetingId}/messages`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `${apiKey}`
                                }
                            });
                            
                            if (statusResponse.ok) {
                                const statusData = await statusResponse.json();
                                if (statusData.status === "已结束") {
                                    console.log("检测到会议已结束，取消定时刷新");
                                    if (window.refreshTimer) {
                                        clearTimeout(window.refreshTimer);
                                        window.refreshTimer = null;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("检查会议状态出错:", e);
                        }
                    }
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    // 从第一个数据块中提取会议ID（如果响应头中没有）
                    if (!currentMeetingId && line.includes("meeting_id")) {
                        try {
                            const match = line.match(/"meeting_id":\s*"([^"]+)"/);
                            if (match && match[1]) {
                                currentMeetingId = match[1];
                                console.log("从响应内容中提取到会议ID:", currentMeetingId);
                                
                                // 加载该会议中的人类角色
                                await loadHumanRoles();
                            }
                        } catch (e) {
                            console.error("提取会议ID时出错:", e);
                        }
                    }
                    
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            // 解析SSE数据
                            const data = JSON.parse(line.substring(6));
                            
                            // 检查是否有内容更新
                            if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                                const delta = data.choices[0].delta;
                                const content = delta.content || '';
                                const reasoningContent = delta.reasoning_content || '';
                                
                                // 检查是否有新发言人标记 "### 名称 发言："
                                const speakerMatch = content.match(/###\s+(.+?)\s+发言：/);
                                
                                if (speakerMatch) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    // 如果有之前的发言者，保存之前的内容
                                    if (currentSpeaker && speakerContent.trim()) {
                                        // 添加内容到UI
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        }
                                    }
                                    
                                    // 新发言人开始
                                    currentSpeaker = speakerMatch[1];
                                    speakerContent = '';
                                    speakerThinkingContent = '';
                                    
                                    // 检查是否是人类角色
                                    const isHumanRole = humanRoles.some(role => role.name === currentSpeaker);
                                    
                                    // 如果是人类角色，提前检查是否需要等待输入
                                    if (isHumanRole) {
                                        console.log(`检测到人类角色 ${currentSpeaker} 即将发言`);
                                        
                                        // 创建新的发言容器，但标记为等待状态
                                        speakerContainer = document.createElement('div');
                                        speakerContainer.classList.add('agent-message', 'human-message', 'waiting-human');
                                        
                                        const speakerHeader = document.createElement('div');
                                        speakerHeader.classList.add('agent-header');
                                        
                                        const speakerNameElement = document.createElement('div');
                                        speakerNameElement.classList.add('agent-name');
                                        speakerNameElement.textContent = currentSpeaker;
                                        
                                        const speakerBadge = document.createElement('div');
                                        speakerBadge.classList.add('agent-badge', 'human-badge');
                                        speakerBadge.textContent = '人类';
                                        
                                        speakerHeader.appendChild(speakerNameElement);
                                        speakerHeader.appendChild(speakerBadge);
                                        
                                        speakerContentElement = document.createElement('div');
                                        speakerContentElement.classList.add('agent-content');
                                        speakerContentElement.textContent = "等待人类输入...";
                                        
                                        speakerContainer.appendChild(speakerHeader);
                                        speakerContainer.appendChild(speakerContentElement);
                                        
                                        chatMessages.appendChild(speakerContainer);
                                        
                                        // 立即检查人类输入
                                        humanRoleName.textContent = currentSpeaker;
                                        await checkForHumanInput();
                                        
                                        // 如果仍然未显示人类输入区域，则强制显示
                                        if (humanInputArea.classList.contains('d-none')) {
                                            console.log(`强制显示人类输入区域给 ${currentSpeaker}`);
                                            isWaitingForHumanInput = true;
                                            humanInputArea.classList.remove('d-none');
                                            document.querySelector('.chat-input').classList.add('d-none');
                                            
                                            // 添加提示消息
                                            // addMessageToChat('system', `轮到 ${currentSpeaker} (人类角色) 发言，请输入您的发言内容`);
                                            
                                            // 聚焦到输入框
                                            humanInputMessage.focus();
                                        }
                                    } else {
                                        // 创建新的发言容器
                                        speakerContainer = document.createElement('div');
                                        speakerContainer.classList.add('agent-message');
                                        speakerContainer.style.display = 'flex';
                                        speakerContainer.style.flexDirection = 'column';
                                        
                                        const speakerHeader = document.createElement('div');
                                        speakerHeader.classList.add('agent-header');
                                        
                                        const speakerNameElement = document.createElement('div');
                                        speakerNameElement.classList.add('agent-name');
                                        speakerNameElement.textContent = currentSpeaker;
                                        
                                        const speakerBadge = document.createElement('div');
                                        speakerBadge.classList.add('agent-badge');
                                        speakerBadge.textContent = 'AI';
                                        
                                        speakerHeader.appendChild(speakerNameElement);
                                        speakerHeader.appendChild(speakerBadge);
                                        
                                        // 创建思考内容容器（先创建）
                                        speakerThinkingContainer = document.createElement('div');
                                        speakerThinkingContainer.classList.add('thinking-container');
                                        speakerThinkingContainer.style.display = 'none'; // 默认隐藏
                                        speakerThinkingContainer.style.width = '100%';
                                        
                                        const thinkingHeader = document.createElement('div');
                                        thinkingHeader.classList.add('thinking-header');
                                        thinkingHeader.innerHTML = '<span class="thinking-toggle-icon">▼</span>查看思考过程';
                                        
                                        const thinkingContent = document.createElement('div');
                                        thinkingContent.classList.add('thinking-content');
                                        
                                        // 默认折叠
                                        thinkingHeader.querySelector('.thinking-toggle-icon').classList.add('collapsed');
                                        thinkingContent.classList.add('collapsed');
                                        
                                        // 添加切换折叠功能
                                        thinkingHeader.addEventListener('click', () => {
                                            const icon = thinkingHeader.querySelector('.thinking-toggle-icon');
                                            icon.classList.toggle('collapsed');
                                            thinkingContent.classList.toggle('collapsed');
                                        });
                                        
                                        speakerThinkingContainer.appendChild(thinkingHeader);
                                        speakerThinkingContainer.appendChild(thinkingContent);
                                        
                                        // 创建内容元素（后创建）
                                        speakerContentElement = document.createElement('div');
                                        speakerContentElement.classList.add('agent-content');
                                        speakerContentElement.style.width = '100%';
                                        
                                        // 先添加思考容器再添加内容（思考在上，回答在下）
                                        speakerContainer.appendChild(speakerHeader);
                                        speakerContainer.appendChild(speakerThinkingContainer);
                                        speakerContainer.appendChild(speakerContentElement);
                                        
                                        chatMessages.appendChild(speakerContainer);
                                    }
                                } 
                                // 检查是否有会议结束和总结标记
                                else if (content.includes("## 会议结束") || content.includes("会议总结") || content.includes("## 会议总结")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到会议结束或总结标记: ", content);
                                    
                                    // 如果有之前的发言者，保存之前的内容
                                    if (currentSpeaker && speakerContent.trim()) {
                                        // 添加内容到UI
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        }
                                    }
                                    
                                    // 创建总结发言人
                                    currentSpeaker = "总结";
                                    speakerContent = content;  // 先添加当前delta到内容中
                                    
                                    // 查找已经存在的总结消息
                                    const existingSummaries = document.querySelectorAll('.summary-message');
                                    if (existingSummaries.length > 0) {
                                        // 如果已经存在总结容器，使用它
                                        speakerContainer = existingSummaries[0];
                                        speakerContentElement = speakerContainer.querySelector('.agent-content');
                                        if (!speakerContentElement) {
                                            speakerContentElement = document.createElement('div');
                                            speakerContentElement.classList.add('agent-content');
                                            speakerContentElement.style.width = '100%';
                                            speakerContainer.appendChild(speakerContentElement);
                                        }
                                        console.log("使用已存在的总结容器");
                                    } else {
                                        // 创建新的发言容器
                                        speakerContainer = document.createElement('div');
                                        speakerContainer.classList.add('agent-message', 'summary-message');
                                        speakerContainer.style.display = 'flex';
                                        speakerContainer.style.flexDirection = 'column';
                                        
                                        const speakerHeader = document.createElement('div');
                                        speakerHeader.classList.add('agent-header');
                                        
                                        const speakerNameElement = document.createElement('div');
                                        speakerNameElement.classList.add('agent-name');
                                        speakerNameElement.textContent = "会议总结";
                                        
                                        const speakerBadge = document.createElement('div');
                                        speakerBadge.classList.add('agent-badge');
                                        speakerBadge.textContent = 'AI';
                                        
                                        speakerHeader.appendChild(speakerNameElement);
                                        speakerHeader.appendChild(speakerBadge);
                                        
                                        speakerContentElement = document.createElement('div');
                                        speakerContentElement.classList.add('agent-content');
                                        speakerContentElement.style.width = '100%';
                                        
                                        speakerContainer.appendChild(speakerHeader);
                                        speakerContainer.appendChild(speakerContentElement);
                                        
                                        chatMessages.appendChild(speakerContainer);
                                        console.log("创建了新的总结容器");
                                    }
                                    
                                    // 确保总结标题显示在顶部
                                    speakerContentElement.innerHTML = marked.parse(speakerContent);
                                    
                                    // 清除检查人类输入的定时器
                                    if (humanCheckInterval) {
                                        clearInterval(humanCheckInterval);
                                        humanCheckInterval = null;
                                    }
                                    
                                    // 设置会议为已结束状态
                                    if (currentMeetingId) {
                                        console.log("会议已结束，清除会议ID");
                                        currentMeetingId = null;
                                    }
                                    
                                    // 滚动到底部
                                    scrollToBottom();
                                }
                                // 当已经在显示总结内容时，继续累积总结内容
                                else if (currentSpeaker === "总结") {
                                    console.log("正在累积总结内容: " + content.substring(0, 30) + (content.length > 30 ? "..." : ""));
                                    speakerContent += content;
                                    
                                    // 更新总结内容
                                    if (speakerContentElement) {
                                        speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        // 滚动到底部
                                        scrollToBottom();
                                    }
                                } 
                                // 检查"等待人类输入"标记
                                else if (content.includes("等待人类输入") || content.includes("waiting for human input")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到等待人类输入的提示");
                                    // 立即检查人类输入状态
                                    await checkForHumanInput();
                                } 
                                // 处理思考内容
                                else if (reasoningContent) {
                                    hasThinkingContent = true;
                                    
                                    if (currentSpeaker) {
                                        // 处理特定发言人的思考内容
                                        speakerThinkingContent += reasoningContent;
                                        
                                        // 更新思考内容
                                        if (speakerThinkingContainer) {
                                            // 显示思考容器
                                            speakerThinkingContainer.style.display = 'block';
                                            
                                            const thinkingContentElement = speakerThinkingContainer.querySelector('.thinking-content');
                                            if (thinkingContentElement) {
                                                thinkingContentElement.innerHTML = marked.parse(speakerThinkingContent);
                                            }
                                        }
                                    } else {
                                        // 处理通用思考内容
                                        thinkingContentText += reasoningContent;
                                        thinkingContent.innerHTML = marked.parse(thinkingContentText);
                                        
                                        // 显示思考容器
                                        thinkingContainer.style.display = 'block';
                                    }
                                }
                                // 处理其他类型的响应...
                                else {
                                    // 处理常规内容更新、总结内容等现有逻辑
                                    if (content) {
                                        if (currentSpeaker) {
                                            speakerContent += content;
                                            if (speakerContentElement) {
                                                speakerContentElement.innerHTML = marked.parse(speakerContent);
                                            }
                                        } else {
                                            fullContent += content;
                                            messageContent.innerHTML = marked.parse(fullContent);
                                        }
                                    }
                                }
                                
                                // 滚动到底部
                                scrollToBottom();
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    } else if (line === 'data: [DONE]') {
                        console.log('讨论完成');
                        
                        // 清理定时刷新
                        if (window.refreshTimer) {
                            clearTimeout(window.refreshTimer);
                            window.refreshTimer = null;
                            console.log("已清理会议刷新定时器");
                        }
                        
                        // 流结束后，检查一次是否需要人类输入
                        await checkForHumanInput();
                    }
                }
            }
            
            // 隐藏加载状态
            hideLoading();
            
            return true;
        } catch (error) {
            console.error('创建讨论失败:', error);
            hideLoading();
            showError(`创建讨论失败: ${error.message}`);
            return false;
        }
    }
    
    // 执行一轮会议讨论
    async function executeMeetingRound() {
            if (!currentMeetingId) {
            console.log("没有活跃的会议ID，无法执行讨论轮次");
                return;
            }
        
        // 如果正在等待人类输入，不执行新的轮次
        if (isWaitingForHumanInput) {
            console.log("正在等待人类输入，暂停讨论轮次");
            return;
        }
        
        try {
            console.log(`执行讨论轮次: meeting_id=${currentMeetingId}`);
            
            // 获取API密钥
            const apiKey = getCurrentApiKey();
            
            // 显示加载状态
            showLoading();
            
            // 调用API执行一轮讨论
            const response = await fetch(`/api/meeting/discussions/${currentMeetingId}/round`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.error("执行讨论轮次失败: 会议不存在");
                    currentMeetingId = null;
                    showError("会议已结束或不存在");
                    return;
                }
                
                const errorText = await response.text();
                console.error(`执行讨论轮次失败: ${response.status} ${errorText}`);
                return;
            }
            
            const data = await response.json();
            console.log('讨论轮次结果:', data);
            
            // 检查是否需要等待人类输入
            if (data.status === "等待人类输入" || data.waiting_for_human_input) {
                console.log(`会议暂停，等待人类${data.waiting_for_human_input || ''}输入`);
                // 禁止自动触发下一轮，等待人类输入
                return;
            }
            
            // 刷新会议状态
            if (window.refreshTimer) {
                clearTimeout(window.refreshTimer);
            }
            window.refreshTimer = setTimeout(refreshDiscussion, 1000);
            
        } catch (error) {
            console.error('执行讨论轮次时出错:', error);
            showError(`执行讨论失败: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
    
    // 加载人类角色
    async function loadHumanRoles() {
        // 检查是否为讨论组模式
        const isDiscussionMode = currentChatMode === 'group';
        
        if (!currentMeetingId || !isDiscussionMode) return;
        
        console.log('加载会议中的人类角色...');
        
        try {
            // 获取API密钥
            const apiKey = getCurrentApiKey();
            
            // 获取人类角色
            const response = await fetch(`/api/meeting/discussions/${currentMeetingId}/human_roles`, {
                method: 'GET',
                headers: {
                    'Authorization': `${apiKey}`
                }
            });
            
            if (!response.ok) {
                console.error(`获取人类角色失败: ${response.status}`);
                return;
            }
            
            humanRoles = await response.json();
            
            console.log('已加载人类角色:', humanRoles);
            
            return humanRoles;
        } catch (error) {
            console.error('加载人类角色失败:', error);
            return [];
        }
    }
    
    /**
     * 检查当前是否需要人类输入（在讨论组中）
     */
    async function checkForHumanInput() {
        // 检查是否为讨论组模式
        const isDiscussionMode = currentChatMode === 'group';
        
        if (!currentMeetingId || !isDiscussionMode) return;
        if (isWaitingForHumanInput) return; // 已经在等待人类输入
        
        console.log('检查是否需要人类输入');
        
        try {
            // 获取API密钥
            const apiKey = getCurrentApiKey();
            
            // 获取会议状态
            const response = await fetch(`/api/meeting/discussions/${currentMeetingId}/messages`, {
                method: 'GET',
                headers: {
                    'Authorization': `${apiKey}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    // 会议不存在，重置会议ID
                    currentMeetingId = null;
                    // 清理定时刷新
                    if (window.refreshTimer) {
                        clearTimeout(window.refreshTimer);
                        window.refreshTimer = null;
                        console.log("已清理会议刷新定时器");
                    }
                }
                console.error(`获取会议状态失败: ${response.status}`);
                return;
            }
            
            const data = await response.json();
            console.log('会议状态:', data);
            
            // 如果会议已结束，不需要人类输入
            if (data.status === "已结束") {
                console.log('会议已结束，不需要人类输入');
                // 清理定时刷新
                if (window.refreshTimer) {
                    clearTimeout(window.refreshTimer);
                    window.refreshTimer = null;
                    console.log("检测到会议已结束，已清理会议刷新定时器");
                }
                return;
            }
            
            // 直接检查会议状态是否为"waiting_for_human"
            if (data.status === "waiting_for_human" && data.waiting_for_agent) {
                // 只有在等待角色是人类角色时才显示输入区域
                const isHumanRole = humanRoles && humanRoles.some(role => role.name === data.waiting_for_agent);
                
                if (isHumanRole) {
                    console.log(`会议状态为waiting_for_human，等待角色: ${data.waiting_for_agent}`);
                    showHumanInputArea(data.waiting_for_agent);
                    return;
                } else {
                    console.log(`会议等待的角色 ${data.waiting_for_agent} 不是人类角色，不显示输入区域`);
                }
            }
            
            
            // 从会议历史中检查是否需要人类输入
            const history = data.history || [];
            const lastMessages = history.slice(-5); // 获取最近5条消息
            
            // 检查是否加载过人类角色
            if (!humanRoles || !humanRoles.length) {
                await loadHumanRoles();
            }
            
            // 1. 检查最后一条消息是否是系统消息指示等待人类输入
            const lastMessage = history[history.length - 1];
            if (lastMessage && lastMessage.agent === "system") {
                const systemContent = lastMessage.content.toLowerCase();
                // 检查系统消息是否指示等待人类输入
                if (systemContent.includes("等待人类输入") || 
                    systemContent.includes("等待用户输入") ||
                    systemContent.includes("请输入")) {
                    
                    // 找到人类角色名称
                    const matchedRole = humanRoles.find(role => 
                        systemContent.includes(role.name.toLowerCase())
                    );
                    
                    if (matchedRole) {
                        showHumanInputArea(matchedRole.name);
                        console.log(`需要人类${matchedRole.name}输入`);
                        return;
                    }
                }
            }
            
            // 2. 查找最近5条消息中是否有明确提到需要人类角色输入的内容
            for (const message of lastMessages) {
                const content = message.content.toLowerCase();
                
                // 检查每个人类角色是否被点名发言
                for (const role of humanRoles) {
                    const roleName = role.name.toLowerCase();
                    
                    // 检查是否有明确等待该角色输入的提示
                    if ((content.includes(`${roleName}请`) || 
                         content.includes(`请${roleName}`) ||
                         content.includes(`轮到${roleName}`) || 
                         content.includes(`该${roleName}发言`) ||
                         content.includes(`${roleName}的回合`) ||
                         content.includes(`等待${roleName}`) ||
                         content.includes(`需要${roleName}`)) &&
                        !content.includes(`${roleName}：`) && 
                        !content.includes(`${roleName}:`)
                       ) {
                        
                        showHumanInputArea(role.name);
                        console.log(`需要人类${role.name}输入 (从消息中检测)`);
                        return;
                    }
                }
                
                
                
            }
            
            // 3. 分析会议状态中的特殊标记
            if (data.waiting_for_human_input) {
                const roleName = data.waiting_for_human_input;
                showHumanInputArea(roleName);
                console.log(`会议状态显示需要人类${roleName}输入`);
                return;
            }
            
            // 4. 检查最近的发言顺序
            if (lastMessages.length >= 2) {
                // 分析最近的发言顺序，看是否该人类角色发言
                const recentSpeakers = lastMessages.map(msg => msg.agent);
                
                // 根据会议模式分析下一个发言者
                if (data.mode) {
                    const agents = data.agents || [];
                    const humanAgents = agents.filter(agent => 
                        humanRoles.some(role => role.name === agent.name)
                    );
                    
                    // 如果有人类角色且当前是他们的回合
                    for (const humanAgent of humanAgents) {
                        // 特定条件下显示人类输入区域
                        if (requiresHumanInputBasedOnPattern(recentSpeakers, humanAgent.name, data.mode)) {
                            showHumanInputArea(humanAgent.name);
                            console.log(`根据发言模式分析，需要人类${humanAgent.name}输入`);
                            return;
                        }
                    }
                }
            }
            
            console.log('未检测到需要人类输入');
            
        } catch (error) {
            console.error('检查人类输入需求失败:', error);
        }
    }
    
    // 根据发言模式分析是否需要人类输入
    function requiresHumanInputBasedOnPattern(speakers, humanName, mode) {
        
        
        return false;
    }
    
    // 显示人类输入区域
    function showHumanInputArea(roleName) {
        // 使用新的实现来避免覆盖前一个角色的内容
        showWaitingForHumanInput(roleName);
        
        // 由于历史兼容性原因，保留该函数，但实际实现委托给新函数
        console.log(`等待人类角色"${roleName}"输入，会议暂停，使用委托方法`);
    }
    
    // 发送人类输入
    async function sendHumanInput() {
        // 获取DOM元素
        const humanInputMessage = document.getElementById('humanInputMessage');
        const humanInputSubmit = document.getElementById('sendHumanInput');
        const humanRoleName = document.getElementById('humanRoleName');
        const humanInputArea = document.getElementById('humanInputArea');
        
        // 获取输入的消息内容
        const messageText = humanInputMessage.value.trim();
        
        // 检查消息是否为空
        if (!messageText) {
            showError('请输入消息内容');
            return;
        }
        
        // 检查是否有会议ID，并确保会议状态有效
        if (!currentMeetingId) {
            try {
                console.log('尝试重新检查会议状态...');
                const checkResponse = await fetch('/api/meeting/discussions/active', {  // 修改为正确的API端点
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (checkResponse.ok) {
                    const data = await checkResponse.json();
                    // 查找状态为进行中、未开始或等待人类输入的会议
                    for (const meetingId in data.meetings) {
                        const discussion = data.meetings[meetingId];
                        if (discussion.status === "进行中" || discussion.status === "等待人类输入" || discussion.status === "未开始") {
                            currentMeetingId = meetingId;
                            console.log(`找到活跃会议ID: ${currentMeetingId}`);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error('重新检查会议状态失败:', error);
            }
            
            // 如果仍然没有会议ID，显示错误
            if (!currentMeetingId) {
                showError('找不到当前会议ID，无法发送人类输入');
                return;
            }
        }
        
        // 获取人类角色名称
        const roleName = humanRoleName.textContent;
            
        // 显示加载状态
        humanInputSubmit.disabled = true;
        humanInputSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 发送中...';
            
        try {
            console.log(`正在发送人类(${roleName})输入...`);
            
            // 获取API密钥
            const apiKey = getCurrentApiKey();
            
            // 发送人类输入到服务器 - 使用新的discussions端点
            const response = await fetch(`/v1/discussions/${currentMeetingId}/human_input`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    agent_name: roleName,
                    message: messageText
                })
            });
            
            // 恢复按钮状态
            humanInputSubmit.disabled = false;
            humanInputSubmit.innerHTML = '发送';
            
            // 检查响应状态
            if (!response.ok) {
                let errorMsg = `发送人类输入失败: ${response.status}`;
                
                try {
                    const errorData = await response.json();
                    errorMsg += ` - ${errorData.detail || errorData.message || '未知错误'}`;
                } catch (e) {
                    // 无法解析JSON，使用原始响应文本
                    errorMsg += ` - ${await response.text() || '未知错误'}`;
                }
                
                if (response.status === 404) {
                    // 会议不存在，重置会议ID
                    errorMsg = '会议已结束或不存在，请重新开始会议';
                    currentMeetingId = null;
                    // 显示错误消息
                    addMessageToChat('system', `错误: ${errorMsg}`);
                } else {
                    // 显示错误消息
                    addMessageToChat('system', `发送失败: ${errorMsg}`);
                }
                
                console.error(errorMsg);
                showError(errorMsg);
                
                // 重置等待状态
            isWaitingForHumanInput = false;
                humanInputArea.classList.add('d-none');
                document.querySelector('.chat-input').classList.remove('d-none');
                
                return;
            }
            
            // 成功发送
            console.log('人类输入发送成功');
            
            // 解析响应数据
            const data = await response.json();
            console.log('服务器响应:', data);
            
            // 检查会议是否已结束
            if (data.status === "已结束") {
                console.log("处理人类输入后，会议已结束，清理定时刷新");
                if (window.refreshTimer) {
                    clearTimeout(window.refreshTimer);
                    window.refreshTimer = null;
                    console.log("已清理会议刷新定时器");
                }
                
                // 当处理人类输入后会议直接结束，主动请求获取总结
                console.log("会议已结束，主动请求获取总结内容");
                // 在短暂延迟后请求总结（给后端时间生成总结）
                setTimeout(() => {
                    fetchMeetingSummary(currentMeetingId);
                }, 1500);
            }
            
            // 清空输入框
            humanInputMessage.value = '';
            
            console.log(`===== 发送人类输入成功，开始清理等待状态 - 角色: ${roleName} =====`);

            // 重置等待状态
            isWaitingForHumanInput = false;
            waitingForHumanName = null; // 重置当前等待的人类角色名称

            // 隐藏人类输入区域，显示普通聊天输入区域
            humanInputArea.classList.add('d-none');
            document.querySelector('.chat-input').classList.remove('d-none');

            // 删除所有与等待人类输入相关的临时消息
            console.log("正在清理所有与人类输入相关的UI元素");

            // 删除提示消息
            const waitingPrompts = document.querySelectorAll('.waiting-human-prompt');
            console.log(`删除 ${waitingPrompts.length} 个等待提示`);
            waitingPrompts.forEach(prompt => prompt.remove());

            // 删除状态指示器
            const statusIndicators = document.querySelectorAll('.human-input-status');
            console.log(`删除 ${statusIndicators.length} 个状态指示器`);
            statusIndicators.forEach(indicator => indicator.remove());

            // 删除人类角色的占位容器
            const waitingMsgs = document.querySelectorAll('.waiting-human');
            console.log(`删除 ${waitingMsgs.length} 个占位容器`);
            waitingMsgs.forEach(msg => msg.remove());

            // 添加人类发言到聊天界面
            addMessageToChat('user', messageText, roleName);
            
            // 等待一段时间，确保后端有时间处理输入
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 重新启动会议流程 - 直接使用discussion_processor继续处理流程
            try {
                console.log("人类输入已处理，重新启动会议流程获取后续角色发言");
                
                // 获取API密钥
                const apiKey = getCurrentApiKey();
                
                // 使用v1/discussions/stream端点继续会议流程
                const streamResponse = await fetch(`/v1/discussions/stream/${currentMeetingId}`, {
                        method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                });
                
                if (!streamResponse.ok) {
                    console.error(`重新连接会议流失败: ${streamResponse.status}`);
                    return;
                }
                
                // 处理流式响应
                const reader = streamResponse.body.getReader();
                const decoder = new TextDecoder();
                
                let currentSpeaker = null;
                let speakerContent = '';
                let speakerContainer = null;
                let speakerContentElement = null;
                
                console.log("开始处理会议流式响应");
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log("流式读取结束");
                        break;
                    }
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.substring(6));
                                
                                // 检查是否有内容更新
                                if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                                    const delta = data.choices[0].delta.content || '';
                                    
                                    // 检查是否结束
                                    if (data.choices[0].finish_reason === "stop") {
                                        console.log("检测到会议结束信号");
                                        
                                        // 清理定时刷新
                                        if (window.refreshTimer) {
                                            clearTimeout(window.refreshTimer);
                                            window.refreshTimer = null;
                                            console.log("已清理会议刷新定时器");
                                        }
                                    }
                                    
                                    // 检查是否有会议结束和总结标记
                                    if (delta.includes("## 会议结束") || delta.includes("会议总结") || delta.includes("## 会议总结")) {
                                        console.log("检测到会议结束或总结标记: ", delta.substring(0, 30));
                                        
                                        // 如果有之前的发言者，保存之前的内容
                                        if (currentSpeaker && speakerContent.trim()) {
                                            // 添加内容到UI
                                            if (speakerContentElement) {
                                                speakerContentElement.innerHTML = marked.parse(speakerContent);
                                            }
                                        }
                                        
                                        // 创建总结发言人
                                        currentSpeaker = "总结";
                                        speakerContent = delta;  // 先添加当前delta到内容中
                                        
                                        // 查找已经存在的总结消息
                                        const existingSummaries = document.querySelectorAll('.summary-message');
                                        if (existingSummaries.length > 0) {
                                            // 如果已经存在总结容器，使用它
                                            speakerContainer = existingSummaries[0];
                                            speakerContentElement = speakerContainer.querySelector('.agent-content');
                                            if (!speakerContentElement) {
                                                speakerContentElement = document.createElement('div');
                                                speakerContentElement.classList.add('agent-content');
                                                speakerContainer.appendChild(speakerContentElement);
                                            }
                                            console.log("使用已存在的总结容器");
                                        } else {
                                            // 创建新的发言容器
                                            speakerContainer = document.createElement('div');
                                            speakerContainer.classList.add('agent-message', 'summary-message');
                                            
                                            const speakerHeader = document.createElement('div');
                                            speakerHeader.classList.add('agent-header');
                                            
                                            const speakerNameElement = document.createElement('div');
                                            speakerNameElement.classList.add('agent-name');
                                            speakerNameElement.textContent = "会议总结";
                                            
                                            const speakerBadge = document.createElement('div');
                                            speakerBadge.classList.add('agent-badge');
                                            speakerBadge.textContent = 'AI';
                                            
                                            speakerHeader.appendChild(speakerNameElement);
                                            speakerHeader.appendChild(speakerBadge);
                                            
                                            speakerContentElement = document.createElement('div');
                                            speakerContentElement.classList.add('agent-content');
                                            
                                            speakerContainer.appendChild(speakerHeader);
                                            speakerContainer.appendChild(speakerContentElement);
                                            
                                            chatMessages.appendChild(speakerContainer);
                                            console.log("创建了新的总结容器");
                                        }
                                        
                                        // 确保总结标题显示在顶部
                                        speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        
                                        // 清除检查人类输入的定时器
                                        if (humanCheckInterval) {
                                            clearInterval(humanCheckInterval);
                                            humanCheckInterval = null;
                                        }
                                        
                                        // 设置会议为已结束状态
                                        if (currentMeetingId) {
                                            console.log("会议已结束，清除会议ID");
                                            currentMeetingId = null;
                                        }
                                        
                                        // 滚动到底部
                                        scrollToBottom();
                                        continue;
                                    }
                                    // 当已经在显示总结内容时，继续累积总结内容
                                    else if (currentSpeaker === "总结") {
                                        console.log("正在累积总结内容: " + delta.substring(0, 30) + (delta.length > 30 ? "..." : ""));
                                        speakerContent += delta;
                                        
                                        // 更新总结内容
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                            // 滚动到底部
                                            scrollToBottom();
                                        }
                                        continue;
                                    }
                                    
                                    // 检查是否有新发言人标记 "### 名称 发言："
                                    const speakerMatch = delta.match(/###\s+(.+?)\s+发言：/);
                                    
                                    if (speakerMatch) {
                                        // 如果有之前的发言者，保存之前的内容
                                        if (currentSpeaker && speakerContent.trim()) {
                                            // 添加内容到UI
                                            if (speakerContentElement) {
                                                speakerContentElement.innerHTML = marked.parse(speakerContent);
                                            }
                                        }
                                        
                                        // 新发言人开始
                                        currentSpeaker = speakerMatch[1];
                                        speakerContent = '';
                                        
                                        // 检查是否是人类角色
                                        const isHumanRole = humanRoles.some(role => role.name === currentSpeaker);
                                        
                                        if (isHumanRole) {
                                            // 如果是等待同一个人类发言，跳过(因为我们刚刚已经发送过了)
                                            continue;
                                        } else {
                                            // 为每个新的AI发言创建一个唯一标识符
                                            const speakerId = `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                            
                                            // 创建新的发言容器
                                            speakerContainer = document.createElement('div');
                                            speakerContainer.classList.add('agent-message');
                                            speakerContainer.setAttribute('data-speaker-id', speakerId);
                                            
                                            const speakerHeader = document.createElement('div');
                                            speakerHeader.classList.add('agent-header');
                                            
                                            const speakerNameElement = document.createElement('div');
                                            speakerNameElement.classList.add('agent-name');
                                            speakerNameElement.textContent = currentSpeaker;
                                            
                                            const speakerBadge = document.createElement('div');
                                            speakerBadge.classList.add('agent-badge');
                                            speakerBadge.textContent = 'AI';
                                            
                                            speakerHeader.appendChild(speakerNameElement);
                                            speakerHeader.appendChild(speakerBadge);
                                            
                                            speakerContentElement = document.createElement('div');
                                            speakerContentElement.classList.add('agent-content');
                                            
                                            speakerContainer.appendChild(speakerHeader);
                                            speakerContainer.appendChild(speakerContentElement);
                                            
                                            chatMessages.appendChild(speakerContainer);
                                            scrollToBottom();
                                            
                                            console.log(`创建新的发言容器，发言者: ${currentSpeaker}, ID: ${speakerId}`);
                                        }
                                    } else if (delta.includes("[WAITING_FOR_HUMAN_INPUT:")) {
                                        // 检测到等待人类输入的标记
                                        const match = delta.match(/\[WAITING_FOR_HUMAN_INPUT:(.*?)\]/);
                                        if (match && match[1]) {
                                            const humanName = match[1];
                                            console.log(`检测到服务器发送的等待人类输入标记: ${humanName}`);
                                            
                                            // 保存当前发言内容，确保不会被覆盖
                                            if (currentSpeaker && speakerContent.trim()) {
                                                console.log(`保存当前角色 ${currentSpeaker} 的内容，长度: ${speakerContent.length}`);
                                                // 将内容添加到UI，确保之前的内容不会丢失
                                                if (speakerContentElement) {
                                                    // 移除可能包含的等待人类输入文本
                                                    const cleanContent = speakerContent.replace(/\[WAITING_FOR_HUMAN_INPUT:.*?\]/g, '').trim();
                                                    speakerContentElement.innerHTML = marked.parse(cleanContent);
                                                }
                                            }
                                            
                                            // 确保当前发言被完全呈现后，再显示等待人类输入状态
                                            setTimeout(() => {
                                                // 使用独立的函数显示等待状态，不创建可能覆盖前一个发言的提示
                                                showWaitingForHumanInput(humanName);
                                            }, 100);
                                        }
                                        continue;
                                    } else {
                                        // 累积当前发言者的内容
                                        speakerContent += delta;
                                        
                                        // 检查是否包含等待人类输入的文本
                                        const waitingTextMatch = delta.match(/等待人类角色\s+(.+?)\s+输入/);
                                        if (waitingTextMatch && waitingTextMatch[1]) {
                                            // 如果是系统消息中包含"等待人类角色 XX 输入"的文本
                                            const humanName = waitingTextMatch[1];
                                            console.log(`检测到系统消息中的等待人类输入提示: ${humanName}`);
                                            
                                            // 记录原始内容，稍后会恢复
                                            console.log("检测到等待人类输入文本，但不会影响现有消息");
                                            
                                            // 确保当前内容已保存
                                            if (currentSpeaker && speakerContent.trim() && speakerContentElement) {
                                                // 移除等待人类输入的提示
                                                const cleanContent = speakerContent.replace(/等待人类角色\s+(.+?)\s+输入/g, '').trim();
                                                speakerContentElement.innerHTML = marked.parse(cleanContent);
                                            }
                                            
                                            // 使用改进的方法显示等待状态，确保不会覆盖之前的消息
                                            setTimeout(() => {
                                                showWaitingForHumanInput(humanName);
                                            }, 100);
                                            
                                            // 跳过将这条消息添加到UI
                                            continue;
                                        }
                                        
                                        // 仅当有当前发言者容器时才更新UI
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                            scrollToBottom();
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('解析流式响应失败:', e, line);
                            }
                        }
                    }
                }
                
                console.log("会议流式响应处理完成");
                
                // 如果会议结束但未看到总结，主动请求获取总结
                if (data.status === "已结束" || currentMeetingId === null) {
                    console.log("流式处理结束，会议已结束，主动请求获取总结");
                    setTimeout(() => {
                        fetchMeetingSummary(currentMeetingId || data.meeting_id);
                    }, 1000);
                }
                
                } catch (error) {
                console.error("重连会议流失败:", error);
                }
            
        } catch (error) {
            console.error('发送人类输入时出错:', error);
            
            // 恢复按钮状态
            humanInputSubmit.disabled = false;
            humanInputSubmit.innerHTML = '发送';
            
            // 显示错误消息
            showError(`发送失败: ${error.message}`);
            
            // 重置等待状态
                isWaitingForHumanInput = false;
                humanInputArea.classList.add('d-none');
                document.querySelector('.chat-input').classList.remove('d-none');
        }
    }
    
    // 构建聊天消息历史
    function buildChatMessages(newMessage) {
        const messages = [...messageHistory];
        messages.push({ role: 'user', content: newMessage });
        return messages;
    }
    
    // 添加消息到聊天界面
    function addMessageToChat(role, content, speakerName = null) {
        // 创建一个唯一标识符
        const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container', role);
        messageContainer.setAttribute('data-message-id', messageId);
        
        // 创建消息头部布局
        const messageHeader = document.createElement('div');
        messageHeader.classList.add('message-header');
        
        // 添加头像
        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar');
        if (role === 'ai') {
            avatarElement.innerHTML = '<div class="text-avatar ai-avatar">AI</div>';
        } 
        
        // 创建名称元素
        const nameElement = document.createElement('div');
        nameElement.classList.add('message-name');
        nameElement.textContent = speakerName || (role === 'ai' ? '助手' : role === 'user' ? '人类' : '系统');
        
        // 根据角色调整头像和名称的顺序
        if (role === 'user' || role === 'human-message') {
            messageHeader.appendChild(nameElement);
            messageHeader.appendChild(avatarElement);
        } else {
            messageHeader.appendChild(avatarElement);
            messageHeader.appendChild(nameElement);
        }
        
        messageContainer.appendChild(messageHeader);
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // 使用markdown渲染内容，使得代码和格式更好看
        messageContent.innerHTML = marked.parse(content);
        
        // 使用统一的代码块处理函数
        setTimeout(() => {
            setupCodeBlockCopyButtons();
            highlightCodeBlocks();
            
            // 如果是AI消息，添加导出按钮
            if (role === 'ai') {
                addExportButtonToMessage(messageContainer);
            }
        }, 0);
        
        messageContainer.appendChild(messageContent);
        chatMessages.appendChild(messageContainer);
        
        console.log(`添加消息到聊天: 角色=${role}, 发言者=${speakerName || '未指定'}, ID=${messageId}`);
        
        // 使用滚动控制函数
        scrollToBottom();
        
        return messageId;
    }
    
    // 更新讨论组聊天界面
    function updateDiscussionChat(data) {
        console.log('更新讨论组聊天内容', data);
        
        if (!data || !data.rounds) {
            console.error('无效的讨论数据');
            return;
        }
        
        // 获取聊天容器并清空现有内容
        const chatContainer = document.getElementById('chatMessages');
        chatContainer.innerHTML = '';
        
        // 遍历所有讨论轮次
        data.rounds.forEach((round, roundIndex) => {
            // 创建讨论轮次容器
            const roundContainer = document.createElement('div');
            roundContainer.className = 'discussion-round';
            
            // 创建轮次标题
            const roundTitle = document.createElement('div');
            roundTitle.className = 'discussion-round-title';
            roundTitle.textContent = `讨论轮次 ${roundIndex + 1}`;
            roundContainer.appendChild(roundTitle);
            
            // 遍历该轮次内的所有消息
            round.messages.forEach(message => {
                // 创建角色消息容器
                const agentMessageContainer = document.createElement('div');
                agentMessageContainer.className = 'agent-message';
                
                // 创建角色头部
                const agentHeader = document.createElement('div');
                agentHeader.className = 'agent-header';
                
                // 创建角色名称
                const agentName = document.createElement('div');
                agentName.className = 'agent-name';
                agentName.textContent = message.role_name || '未知角色';
                agentHeader.appendChild(agentName);
                
                // 如果有角色类型，显示为徽章
                if (message.role_type) {
                    const agentBadge = document.createElement('div');
                    agentBadge.className = 'agent-badge';
                    agentBadge.textContent = message.role_type;
                    agentHeader.appendChild(agentBadge);
                }
                
                // 添加头部到消息容器
                agentMessageContainer.appendChild(agentHeader);
                
                // 创建消息内容
                const agentContent = document.createElement('div');
                agentContent.className = 'agent-content';
                
                // 使用marked处理消息内容中的Markdown
                let processedContent = message.content;
                try {
                    if (window.marked) {
                        processedContent = marked.parse(message.content);
                    }
                } catch (e) {
                    console.error('Markdown解析失败:', e);
                }
                
                agentContent.innerHTML = processedContent;
                agentMessageContainer.appendChild(agentContent);
                
                // 添加消息到轮次容器
                roundContainer.appendChild(agentMessageContainer);
                
                // 为每个代理消息添加导出按钮
                addExportButtonToMessage(agentMessageContainer);
            });
            
            // 添加轮次容器到聊天容器
            chatContainer.appendChild(roundContainer);
            
            // 为讨论轮次添加导出按钮
            addExportButtonToMessage(roundContainer);
        });
        
        // 高亮处理代码块
        highlightCodeBlocks();
        // 为代码块添加复制按钮
        setupCodeBlockCopyButtons();
        
        // 如果需要人类输入，显示人类输入区域
        if (data.wait_for_human) {
            showHumanInputArea(data.human_role_name || '您');
        }
        
        // 滚动到底部
        scrollToBottom();
    }
    
    // 重置聊天
    function resetChat() {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h3 data-translate="welcomeToChat">欢迎使用 DeepGemini 对话界面</h3>
                <p data-translate="chatInstructions">选择聊天模式并开始对话</p>
            </div>
        `;
        
        // 清空消息历史
        messageHistory = [];
        
        // 重置讨论组数据
        currentMeetingId = null;
        humanRoles = [];
        isWaitingForHumanInput = false;
        
        // 清理定时刷新
        if (window.refreshTimer) {
            clearTimeout(window.refreshTimer);
            window.refreshTimer = null;
            console.log("已清理会议刷新定时器");
        }
        
        // 隐藏人类输入区域
        humanInputArea.classList.add('d-none');
        document.querySelector('.chat-input').classList.remove('d-none');
    }
    
    // 显示错误消息
    function showError(message) {
        addMessageToChat('system', `错误: ${message}`);
    }
    
    // 显示加载状态
    function showLoading() {
        loadingSpinner.classList.add('show');
    }
    
    // 隐藏加载状态
    function hideLoading() {
        loadingSpinner.classList.remove('show');
    }
    
    // 语言转换支持
    function updateTranslations() {
        const elements = document.querySelectorAll('[data-translate]');
        const currentLang = getCurrentLanguage();
        
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = getCurrentTranslation(key);
            if (translation) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    }
    
    // 添加到现有app.js的语言转换函数
    if (typeof translations !== 'undefined') {
        // 添加聊天界面翻译
        translations.en = {
            ...translations.en,
            chatInterface: 'Chat Interface',
            singleModel: 'Single Model',
            relayChain: 'Relay Chain',
            roleChat: 'Role Chat',
            discussionGroup: 'Discussion Group',
            selectModel: 'Select Model',
            selectRelayChain: 'Select Relay Chain',
            selectRole: 'Select Role',
            selectDiscussionGroup: 'Select Discussion Group',
            discussionTopic: 'Discussion Topic',
            exportMarkdown: 'Export Chat',
            send: 'Send',
            welcomeToChat: 'Welcome to DeepGemini Chat Interface',
            chatInstructions: 'Select a chat mode and start the conversation',
            speakingAs: 'Speaking as ',
            identity: '',
            submitMessage: 'Submit Message'
        };
        
        translations.zh = {
            ...translations.zh,
            chatInterface: '对话界面',
            singleModel: '单个模型',
            relayChain: '接力链',
            roleChat: '角色对话',
            discussionGroup: '讨论组',
            selectModel: '选择模型',
            selectRelayChain: '选择接力链',
            selectRole: '选择角色',
            selectDiscussionGroup: '选择讨论组',
            discussionTopic: '讨论主题',
            exportMarkdown: '导出对话',
            send: '发送',
            welcomeToChat: '欢迎使用 DeepGemini 对话界面',
            chatInstructions: '选择聊天模式并开始对话',
            speakingAs: '正在以',
            identity: '身份发言',
            submitMessage: '提交发言'
        };
        
        // 调用更新翻译
        updateTranslations();
    }
    
    // 获取默认API密钥
    async function fetchDefaultApiKey() {
        try {
            const response = await fetch('/v1/system/default_api_key');
            
            if (response.ok) {
                const data = await response.json();
                if (data.api_key) {
                    defaultApiKey = data.api_key;
                    // 存储到localStorage中，方便后续使用
                    localStorage.setItem('api_key', defaultApiKey);
                    console.log('成功获取到默认API密钥');
                }
            } else {
                console.warn('无法获取默认API密钥，将使用预设值');
            }
        } catch (error) {
            console.error('获取默认API密钥失败:', error);
        }
    }
    
    // 获取当前API密钥
    function getCurrentApiKey() {
        return localStorage.getItem('api_key') || defaultApiKey;
    }
    
    // 刷新会议消息
    async function refreshMessages() {
        try {
            // 确保会议ID存在
            if (!currentMeetingId) {
                console.error('无法刷新消息：没有活跃的会议');
                return;
            }
            
            // 获取API密钥
            const apiKey = getCurrentApiKey();
            
            // 获取更新的讨论消息
            const messagesResponse = await fetch(`/api/meeting/discussions/${currentMeetingId}/messages`, {
                headers: {
                    'Authorization': `${apiKey}` // 添加API密钥到请求头
                }
            });
            
            // 处理响应状态
            if (!messagesResponse.ok) {
                // 当状态码不是2xx时
                if (messagesResponse.status === 401) {
                    throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
                } else if (messagesResponse.status === 404) {
                    // 会议不存在，重置会议ID
                    currentMeetingId = null;
                    throw new Error('会议不存在，请重新创建讨论');
                } else {
                    throw new Error(`获取讨论消息失败: ${messagesResponse.status} ${messagesResponse.statusText}`);
                }
            }
            
            const messagesData = await messagesResponse.json();
            
            // 更新聊天界面
            updateDiscussionChat(messagesData);
            
            return messagesData;
        } catch (error) {
            console.error('刷新消息失败:', error);
            return null;
        }
    }
    
    // 刷新讨论状态，获取最新消息
    async function refreshDiscussion() {
        if (!currentMeetingId) {
            console.log("没有活跃的会议ID，无法刷新讨论");
            return;
        }
        
        try {
            // 获取API密钥
            const apiKey = getCurrentApiKey();
            
            // 显示加载指示器
            showLoading();
            
            console.log(`刷新会议状态: meeting_id=${currentMeetingId}`);
            
            // 获取会议状态
            const response = await fetch(`/api/meeting/discussions/${currentMeetingId}/messages`, {
                method: 'GET',
                headers: {
                    'Authorization': `${apiKey}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    // 会议不存在，重置会议ID
                    currentMeetingId = null;
                    showError("会议已结束或不存在");
                    
                    // 清理定时刷新
                    if (window.refreshTimer) {
                        clearTimeout(window.refreshTimer);
                        window.refreshTimer = null;
                        console.log("已清理会议刷新定时器");
                    }
                    return;
                }
                console.error(`获取会议状态失败: ${response.status}`);
                return;
            }
            
            const data = await response.json();
            console.log('会议最新状态:', data);
            
            // 更新讨论界面
            updateDiscussionChat(data);
            
            // 检查会议是否已结束
            if (data.status === "已结束") {
                console.log("会议已结束，清理资源");
                
                // 重置会议ID，防止继续发送请求
                currentMeetingId = null;
                
                // 清理定时刷新
                if (window.refreshTimer) {
                    clearTimeout(window.refreshTimer);
                    window.refreshTimer = null;
                }
                
                // 不再发送额外的结束请求，总结应该已经在流输出中
                hideLoading();
                return;
            }
            
            // 如果会议仍在进行中，设置下一次刷新
            if (window.refreshTimer) {
                clearTimeout(window.refreshTimer);
            }
            window.refreshTimer = setTimeout(refreshDiscussion, 3000);
            
            // 隐藏加载指示器
            hideLoading();
        } catch (error) {
            console.error('刷新讨论失败:', error);
            hideLoading();
            
            // 继续设置下一次刷新（即使出错也尝试）
            if (window.refreshTimer) {
                clearTimeout(window.refreshTimer);
            }
            window.refreshTimer = setTimeout(refreshDiscussion, 5000);  // 出错后延长等待时间
        }
    }
    
    // 显示等待人类输入状态
    function showWaitingForHumanInput(roleName) {
        console.log(`====== 显示等待人类输入状态开始 - 角色: ${roleName} ======`);
        
        if (!roleName) {
            console.error("缺少人类角色名称，无法显示等待状态");
            return;
        }
        
        if (isWaitingForHumanInput) {
            console.log("已经处于等待状态，不重复处理");
            return; // 避免重复显示
        }
        
        // 设置等待人类输入状态
        isWaitingForHumanInput = true;
        waitingForHumanName = roleName; // 记录当前等待的人类角色名称
        
        console.log(`设置等待人类输入状态 - 角色: ${roleName}`);
        
        // 更新UI以显示人类输入区域
        const humanRoleNameElem = document.getElementById('humanRoleName');
        if (humanRoleNameElem) {
            humanRoleNameElem.textContent = roleName;
        } else {
            console.error("找不到 humanRoleName 元素");
        }
        
        const humanInputAreaElem = document.getElementById('humanInputArea');
        if (humanInputAreaElem) {
            humanInputAreaElem.classList.remove('d-none');
        } else {
            console.error("找不到 humanInputArea 元素");
        }
        
        const chatInputElem = document.querySelector('.chat-input');
        if (chatInputElem) {
            chatInputElem.classList.add('d-none');
        } else {
            console.error("找不到 .chat-input 元素");
        }
        
        // 首先移除所有现有的人类输入状态指示器
        const existingIndicators = document.querySelectorAll('.human-input-status');
        console.log(`移除 ${existingIndicators.length} 个现有状态指示器`);
        existingIndicators.forEach(indicator => indicator.remove());
        
        // 创建一个与正常消息在视觉上区分的状态指示器
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'human-input-status';
        statusIndicator.setAttribute('data-role', roleName);
        // 添加唯一标识符
        statusIndicator.setAttribute('data-status-id', `status-${Date.now()}`);
        statusIndicator.innerHTML = `<p class="text-info"><i class="fas fa-user-edit"></i> 系统提示: 等待人类角色 ${roleName} 输入...</p>`;
        
        // 获取聊天容器
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) {
            console.error("找不到聊天消息容器");
            return;
        }
        
        // 将状态指示器添加到聊天容器最底部
        chatContainer.appendChild(statusIndicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        console.log("已添加状态指示器到聊天容器底部");
        
        // 不再创建隐藏的占位容器，避免干扰
        
        // 聚焦输入框
        const humanInputMessage = document.getElementById('humanInputMessage');
        if (humanInputMessage) {
            humanInputMessage.focus();
            console.log("已聚焦到人类输入框");
        } else {
            console.error("找不到 humanInputMessage 元素");
        }
        
        console.log(`====== 显示等待人类输入状态完成 - 角色: ${roleName} ======`);
    }
    
    // 这里删除重复的滚动控制按钮代码
    
});

// 侧边栏导航
document.addEventListener('DOMContentLoaded', function() {
    // 监听侧边栏项目点击
    const sidebarItems = document.querySelectorAll('.sidebar-menu li');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            // 如果是chatllm页面，直接导航
            if (page === 'chatllm') {
                window.location.href = '/static/chatllm.html';
                return;
            }
            
            // 其他页面导航到index.html并带上页面参数
            window.location.href = '/static/index.html?page=' + page;
        });
    });
}); 

// 补充toggleTheme函数
function toggleTheme() {
    const body = document.body;
    const darkModeControl = document.querySelector('.dark-mode-control');
    const darkModeText = darkModeControl.querySelector('[data-translate="darkMode"]');
    
    body.classList.toggle('dark-theme');
    darkModeControl.classList.toggle('dark');
    
    // 更新文字
    const lang = localStorage.getItem('preferred_language') || 'zh';
    if (body.classList.contains('dark-theme')) {
        darkModeText.textContent = lang === 'zh' ? '日间模式' : 'Light Mode';
    } else {
        darkModeText.textContent = lang === 'zh' ? '夜间模式' : 'Dark Mode';
    }
    
    // 保存主题偏好
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('dark_theme', isDark);
    
    // 触发主题变化事件，更新相关样式
    document.dispatchEvent(new CustomEvent('themeChanged'));
    
    // 更新代码块样式
    updateCodeBlocksTheme();
} 

// 更新代码块主题
function updateCodeBlocksTheme() {
    console.log('更新代码块主题');
    const isDarkMode = document.body.classList.contains('dark-theme');
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
        if (isDarkMode) {
            block.classList.add('dark-code');
        } else {
            block.classList.remove('dark-code');
        }
    });
    
    // 在主题切换后重新处理一下代码块的复制按钮
    setTimeout(() => setupCodeBlockCopyButtons(), 0);
}

// 添加主题变化事件监听器
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('themeChanged', updateCodeBlocksTheme);
});

// 添加一个新函数来专门获取会议总结
async function fetchMeetingSummary(meetingId) {
    if (!meetingId) {
        console.log("无法获取总结：会议ID不存在");
        return;
    }
}

// 修复exportChatAsMarkdown函数
function exportChatAsMarkdown() {
    console.log('开始导出对话为Markdown文件');
    
    // 获取当前聊天模式
    const currentMode = (typeof currentChatMode !== 'undefined') ? currentChatMode : 'single';
    
    // 创建Markdown文本
    let markdownContent = `# DeepGemini 对话记录\n\n`;
    markdownContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
    
    // 根据不同的聊天模式添加特定信息
    switch (currentMode) {
        case 'single':
            // 获取当前选择的模型
            const modelId = singleModelSelect.value;
            const modelConfig = window.modelConfigs?.[modelId] || {};
            const isReasoningModel = modelConfig.type === 'reasoning';
            
            // 如果是reasoning模型，添加模型信息
            if (isReasoningModel) {
                markdownContent += `模型: ${modelConfig.name || '未知模型'} (思考型模型)\n\n`;
            } else {
                const modelName = modelConfig.name || '未知模型';
                markdownContent += `模型: ${modelName}\n\n`;
            }
            break;
            
        case 'relay':
            // 获取当前选择的接力链
            const relayId = relayChainSelect.value;
            const relayOption = relayChainSelect.options[relayChainSelect.selectedIndex];
            const relayName = relayOption ? relayOption.textContent : '未知接力链';
            markdownContent += `接力链模式: ${relayName}\n\n`;
            break;
            
        case 'role':
            // 获取当前选择的角色
            const roleId = roleChatSelect.value;
            const roleOption = roleChatSelect.options[roleChatSelect.selectedIndex];
            const roleName = roleOption ? roleOption.textContent : '未知角色';
            markdownContent += `角色对话模式: ${roleName}\n\n`;
            break;
            
        case 'group':
            // 获取当前选择的讨论组
            const groupId = discussionGroupSelect.value;
            const groupOption = discussionGroupSelect.options[discussionGroupSelect.selectedIndex];
            const groupName = groupOption ? groupOption.textContent : '未知讨论组';
            markdownContent += `讨论组模式: ${groupName}\n\n`;
            break;
    }
    
    // 获取聊天容器
    const chatContainer = document.getElementById('chatMessages');
    
    // 处理讨论组模式下的特殊情况
    if (currentMode === 'group') {
        // 讨论组模式下，查找讨论轮次
        const discussionRounds = chatContainer.querySelectorAll('.discussion-round');
        
        if (discussionRounds.length > 0) {
            discussionRounds.forEach((round, index) => {
                // 获取轮次标题
                const roundTitle = round.querySelector('.discussion-round-title');
                const title = roundTitle ? roundTitle.textContent : `讨论轮次 ${index + 1}`;
                
                markdownContent += `## ${title}\n\n`;
                
                // 获取该轮次内的所有消息
                const agentMessages = round.querySelectorAll('.agent-message');
                agentMessages.forEach(message => {
                    // 获取角色名称
                    const nameEl = message.querySelector('.agent-name');
                    const name = nameEl ? nameEl.textContent : '参与者';
                    
                    // 获取消息内容
                    const contentEl = message.querySelector('.agent-content');
                    if (!contentEl) return;
                    
                    // 将HTML内容转换为Markdown
                    let content = contentEl.innerHTML;
                    
                    // 处理代码块
                    const codeBlocks = contentEl.querySelectorAll('pre code');
                    codeBlocks.forEach(block => {
                        const language = block.className.replace('language-', '').replace('dark-code', '').trim() || '';
                        const code = block.textContent;
                        const codeMarkdown = `\`\`\`${language}\n${code}\n\`\`\``;
                        
                        // 在内容中替换代码块
                        content = content.replace(block.parentNode.outerHTML, codeMarkdown);
                    });
                    
                    // 简单处理HTML转Markdown
                    content = content
                        .replace(/<\/?p>/g, '\n')
                        .replace(/<br\s*\/?>/g, '\n')
                        .replace(/<\/?strong>/g, '**')
                        .replace(/<\/?em>/g, '_')
                        .replace(/<\/?code>/g, '`')
                        .replace(/<\/?[^>]+(>|$)/g, '') // 删除其他HTML标签
                        .trim();
                    
                    // 添加到Markdown文本
                    markdownContent += `### ${name}\n\n${content}\n\n`;
                });
                
                markdownContent += `---\n\n`;
            });
        }
    } else {
        // 单模型、接力链和角色对话模式的处理
        // 获取所有消息容器
        const messageContainers = chatContainer.querySelectorAll('.message-container');
        
        // 遍历消息容器
        messageContainers.forEach(container => {
            // 跳过欢迎消息
            if (container.classList.contains('welcome-message')) {
                return;
            }
            
            // 获取消息角色和名称
            const role = container.classList.contains('ai') ? 'AI' : 
                         container.classList.contains('user') ? '用户' : 
                         container.classList.contains('system') ? '系统' : '其他';
                         
            const nameElement = container.querySelector('.message-name');
            const name = nameElement ? nameElement.textContent : role;
            
            // 获取消息内容
            const contentElement = container.querySelector('.message-content');
            if (!contentElement) return;
            
            // 将HTML内容转换为Markdown
            let content = contentElement.innerHTML;
            
            // 处理代码块
            const codeBlocks = contentElement.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                const language = block.className.replace('language-', '').replace('dark-code', '').trim() || '';
                const code = block.textContent;
                const codeMarkdown = `\`\`\`${language}\n${code}\n\`\`\``;
                
                // 在内容中替换代码块
                content = content.replace(block.parentNode.outerHTML, codeMarkdown);
            });
            
            // 简单处理HTML转Markdown
            content = content
                .replace(/<\/?p>/g, '\n')
                .replace(/<br\s*\/?>/g, '\n')
                .replace(/<\/?strong>/g, '**')
                .replace(/<\/?em>/g, '_')
                .replace(/<\/?code>/g, '`')
                .replace(/<\/?[^>]+(>|$)/g, '') // 删除其他HTML标签
                .trim();
            
            // 添加到Markdown文本
            markdownContent += `## ${name}\n\n${content}\n\n`;
            
            // 如果是思考型模型和AI回复，添加思考过程
            if (currentMode === 'single') {
                const modelConfig = window.modelConfigs?.[singleModelSelect.value] || {};
                const isReasoningModel = modelConfig.type === 'reasoning';
                
                if (isReasoningModel && role === 'AI') {
                    const thinkingContent = container.querySelector('.thinking-content');
                    if (thinkingContent && !thinkingContent.classList.contains('collapsed')) {
                        let thinking = thinkingContent.innerHTML;
                        
                        // 处理思考内容中的代码块
                        const thinkingCodeBlocks = thinkingContent.querySelectorAll('pre code');
                        thinkingCodeBlocks.forEach(block => {
                            const language = block.className.replace('language-', '').replace('dark-code', '').trim() || '';
                            const code = block.textContent;
                            const codeMarkdown = `\`\`\`${language}\n${code}\n\`\`\``;
                            
                            // 在思考内容中替换代码块
                            thinking = thinking.replace(block.parentNode.outerHTML, codeMarkdown);
                        });
                        
                        // 处理思考内容HTML
                        thinking = thinking
                            .replace(/<\/?p>/g, '\n')
                            .replace(/<br\s*\/?>/g, '\n')
                            .replace(/<\/?strong>/g, '**')
                            .replace(/<\/?em>/g, '_')
                            .replace(/<\/?code>/g, '`')
                            .replace(/<\/?[^>]+(>|$)/g, '') // 删除其他HTML标签
                            .trim();
                        
                        if (thinking) {
                            markdownContent += `### 思考过程\n\n${thinking}\n\n---\n\n`;
                        }
                    }
                }
            }
        });
    }
    
    // 创建下载链接
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 根据模式设置不同的文件名
    let fileName;
    switch (currentMode) {
        case 'single':
            fileName = `deepgemini-chat-${Date.now()}.md`;
            break;
        case 'relay':
            fileName = `deepgemini-relay-chat-${Date.now()}.md`;
            break;
        case 'role':
            fileName = `deepgemini-role-chat-${Date.now()}.md`;
            break;
        case 'group':
            fileName = `deepgemini-group-discussion-${Date.now()}.md`;
            break;
        default:
            fileName = `deepgemini-chat-${Date.now()}.md`;
    }
    
    link.download = fileName;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 将导出功能添加到每个AI消息
function addExportButtonToMessage(messageContainer) {
    // 获取当前聊天模式
    let currentMode = 'single'; // 默认为单模型对话
    
    // 检查是否存在全局的currentChatMode变量
    if (typeof currentChatMode !== 'undefined') {
        currentMode = currentChatMode;
    } else {
        // 尝试从DOM确定当前模式
        const activeModeRadio = document.querySelector('input[name="chatMode"]:checked');
        if (activeModeRadio) {
            currentMode = activeModeRadio.value;
        }
    }
    
    // 只有在特定情况下添加导出按钮
    if (currentMode === 'group') {
        // 讨论组模式 - 在讨论轮次容器和AI代理消息上添加导出按钮
        if (!messageContainer.classList.contains('discussion-round') && 
            !messageContainer.classList.contains('agent-message')) {
            return;
        }
    } else {
        // 其他模式(单模型、接力链、角色对话) - 只在AI消息上添加导出按钮
        if (!messageContainer.classList.contains('ai')) {
            return;
        }
    }
    
    // 检查是否已有导出按钮
    if (messageContainer.querySelector('.message-export-btn')) {
        return;
    }
    
    // 创建导出按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'message-export-btn';
    exportBtn.innerHTML = '<i class="fas fa-download"></i>';
    exportBtn.title = '导出对话';
    
    // 添加点击事件来导出当前对话
    exportBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 确保全局变量currentChatMode有效
        if (typeof currentChatMode === 'undefined' || currentChatMode === null) {
            // 尝试从DOM确定当前模式
            const activeModeRadio = document.querySelector('input[name="chatMode"]:checked');
            if (activeModeRadio) {
                window.currentChatMode = activeModeRadio.value;
            } else {
                // 默认设为单模型模式
                window.currentChatMode = 'single';
            }
        }
        
        exportChatAsMarkdown();
    });
    
    // 添加到消息容器
    messageContainer.appendChild(exportBtn);
}

// 为当前和新添加的代码块添加复制按钮
function setupCodeBlockCopyButtons() {
    // 获取所有没有复制按钮的代码块
    const codeBlocks = document.querySelectorAll('pre code:not([data-copy-initialized])');
    
    codeBlocks.forEach(block => {
        // 标记为已初始化
        block.setAttribute('data-copy-initialized', 'true');
        
        // 添加复制按钮
        const pre = block.parentNode;
        
        // 防止重复添加按钮
        const existingButton = pre.querySelector('.code-copy-btn');
        if (existingButton) {
            return;
        }
        
        // 创建右上角复制按钮
        const copyButtonTop = document.createElement('button');
        copyButtonTop.className = 'code-copy-btn';
        copyButtonTop.innerHTML = '<i class="fas fa-copy"></i>';
        copyButtonTop.title = '复制代码';
        
        // 创建右下角复制按钮
        const copyButtonBottom = document.createElement('button');
        copyButtonBottom.className = 'code-copy-btn-bottom';
        copyButtonBottom.innerHTML = '<i class="fas fa-copy"></i>';
        copyButtonBottom.title = '复制代码';
        
        // 创建复制代码的函数
        const copyCode = function(e, button) {
            e.preventDefault();
            e.stopPropagation();
            
            const code = block.textContent;
            
            // 使用更可靠的复制方法
            const textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.style.position = 'fixed';  // 避免滚动到页面底部
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    // 复制成功效果
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.classList.add('copied');
                    
                    // 同时更新两个按钮状态
                    const otherButton = button === copyButtonTop ? copyButtonBottom : copyButtonTop;
                    otherButton.innerHTML = '<i class="fas fa-check"></i>';
                    otherButton.classList.add('copied');
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.classList.remove('copied');
                        otherButton.innerHTML = originalHTML;
                        otherButton.classList.remove('copied');
                    }, 1500);
                }
            } catch (err) {
                console.error('无法复制代码:', err);
                // 回退到navigator.clipboard API
                navigator.clipboard.writeText(code).then(() => {
                    // 复制成功效果
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.classList.add('copied');
                    
                    // 同时更新两个按钮状态
                    const otherButton = button === copyButtonTop ? copyButtonBottom : copyButtonTop;
                    otherButton.innerHTML = '<i class="fas fa-check"></i>';
                    otherButton.classList.add('copied');
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.classList.remove('copied');
                        otherButton.innerHTML = originalHTML;
                        otherButton.classList.remove('copied');
                    }, 1500);
                });
            } finally {
                document.body.removeChild(textarea);
            }
        };
        
        // 添加事件监听器
        copyButtonTop.addEventListener('click', (e) => copyCode(e, copyButtonTop));
        copyButtonBottom.addEventListener('click', (e) => copyCode(e, copyButtonBottom));
        
        // 为复制按钮容器添加定位
        if (!pre.style.position || pre.style.position === 'static') {
            pre.style.position = 'relative';
        }
        
        // 添加两个按钮到代码块
        pre.appendChild(copyButtonTop);
        pre.appendChild(copyButtonBottom);
    });
}

// 添加一个MutationObserver来监听DOM变化
document.addEventListener('DOMContentLoaded', function() {
    // 初次运行，处理页面上已有的代码块
    setupCodeBlockCopyButtons();
    highlightCodeBlocks();
    
    // 确保导出按钮可见
    const exportButton = document.getElementById('exportMarkdown');
    if (exportButton) {
        exportButton.style.display = 'flex';
    }
    
    // 创建观察器实例
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                // 检查新添加的节点中是否有代码块
                setupCodeBlockCopyButtons();
                highlightCodeBlocks();
            }
        });
    });
    
    // 配置观察选项
    const config = { childList: true, subtree: true };
    
    // 开始观察目标节点
    observer.observe(document.body, config);
});

// 高亮代码块，但跳过思考内容中的代码块
function highlightCodeBlocks() {
    if (window.hljs) {
        // 只处理不在思考内容中的代码块
        document.querySelectorAll('pre code:not(.thinking-content pre code)').forEach((block) => {
            // 检查是否在思考内容中
            if (!block.closest('.thinking-content')) {
                hljs.highlightElement(block);
            }
        });
    }
}

// 将导出功能添加到每个AI消息
function addExportButtonToMessage(messageContainer) {
    // 检查是否是AI消息
    if (!messageContainer.classList.contains('ai')) {
        return;
    }
    
    // 检查是否已有导出按钮
    if (messageContainer.querySelector('.message-export-btn')) {
        return;
    }
    
    // 创建导出按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'message-export-btn';
    exportBtn.innerHTML = '<i class="fas fa-download"></i>';
    exportBtn.title = '导出对话';
    
    // 添加点击事件来导出当前对话
    exportBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 确保全局变量currentChatMode有效
        if (typeof currentChatMode === 'undefined') {
            // 尝试从DOM确定当前模式
            const activeModeRadio = document.querySelector('input[name="chatMode"]:checked');
            if (activeModeRadio) {
                window.currentChatMode = activeModeRadio.value;
            } else {
                // 默认设为单模型模式
                window.currentChatMode = 'single';
            }
        }
        
        exportChatAsMarkdown();
    });
    
    // 添加到消息容器
    messageContainer.appendChild(exportBtn);
}

// 更新marked配置，添加语言标识，但不高亮思考内容中的代码
function setupMarkedOptions() {
    if (window.marked) {
        marked.setOptions({
            highlight: function(code, lang, info) {
                // 检查是否应该跳过高亮
                // 这里无法直接检测是否在思考内容中，但我们可以在CSS中覆盖这些样式
                const language = lang || '';
                if (language && hljs.getLanguage(language)) {
                    return hljs.highlight(code, { language: language }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            langPrefix: 'hljs language-', // 添加类前缀
            gfm: true, // 启用GitHub风格Markdown
            breaks: true // 启用换行符转换为<br>
        });
        
        // 保存原始渲染器
        const originalRenderer = new marked.Renderer();
        
        // 创建自定义渲染器来处理代码块
        const renderer = new marked.Renderer();
        
        // 重写代码块渲染器
        renderer.code = function(code, language) {
            // 如果是HTML代码块，确保不会被渲染
            if (language === 'html') {
                // 对HTML代码进行转义，防止被渲染
                const escapedCode = escapeHtml(code);
                return `<pre><code class="language-html">${escapedCode}</code></pre>`;
            }
            // 在这里，我们仍然使用原始的高亮函数，但CSS将覆盖思考内容中的高亮
            const highlightedCode = originalRenderer.code(code, language);
            return highlightedCode;
        };
        
        // 防止HTML代码块被渲染，直接显示原始HTML代码
        renderer.html = function(html) {
            if (html.trim().startsWith('<') && html.trim().endsWith('>')) {
                // 对HTML代码进行转义，防止被渲染
                return `<pre><code class="language-html">${escapeHtml(html)}</code></pre>`;
            }
            return originalRenderer.html(html);
        };
        
        // HTML转义辅助函数
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        marked.use({ renderer });
    }
}

// 初始化函数
async function init() {
    try {
        // 获取API密钥
        await fetchDefaultApiKey();
        
        // 配置marked使用highlight.js
        setupMarkedOptions();
        
        // 获取配置
        await Promise.all([
            loadModels(),
            loadConfigurations(),
            loadRoles(),
            loadGroups()
        ]);
        
        // 设置事件监听器
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }
        
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        }
        
        // 监听聊天模式切换
        const chatModeElement = document.getElementById('chatMode');
        if (chatModeElement) {
            chatModeElement.addEventListener('change', handleChatModeChange);
        
        // 初始设置活跃模式
            setActiveChatMode(chatModeElement.value);
        }
        
        // 设置讨论组选择的事件监听器
        if (discussionGroupSelect) {
            discussionGroupSelect.addEventListener('change', function() {
                // 更新当前选中的讨论组ID
                currentGroupId = this.value;
                console.log('已选择讨论组:', currentGroupId);
            });
        }
        
        // 设置人类输入区域事件
        const humanSendButton = document.getElementById('sendHumanInput');
        if (humanSendButton) {
            humanSendButton.addEventListener('click', sendHumanInput);
        }
        
        const humanInputMessage = document.getElementById('humanInputMessage');
        if (humanInputMessage) {
            humanInputMessage.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendHumanInput();
            }
        });
        }
        
        // 设置重置按钮
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', resetChat);
        }
        
        // 隐藏加载提示
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // 设置定时器检查人类输入状态
        setInterval(checkForHumanInput, 3000); // 每3秒检查一次
        
        // 不再需要全局导出按钮
        const oldExportButton = document.getElementById('exportMarkdown');
        if (oldExportButton) {
            oldExportButton.remove(); // 移除旧的导出按钮
        }
        
        console.log('初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        showError('初始化失败: ' + error.message);
    }
}

// 更新思考内容而不破坏流式输出
function updateThinkingContent(container, content) {
    // 保存滚动状态
    const wasScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 5;
    
    // 保存用户焦点位置
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    const ranges = [];
    for (let i = 0; i < selection.rangeCount; i++) {
        ranges.push(selection.getRangeAt(i));
    }
    
    // 使用安全的方式更新内容，不使用innerHTML直接替换
    // 创建一个临时容器
    const temp = document.createElement('div');
    temp.style.display = 'none';
    temp.innerHTML = marked.parse(content);
    document.body.appendChild(temp);
    
    // 清空容器但保留它自己
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // 将解析后的内容复制到容器中
    while (temp.firstChild) {
        container.appendChild(temp.firstChild);
    }
    
    // 移除临时容器
    document.body.removeChild(temp);
    
    // 还原用户焦点
    if (activeElement) {
        activeElement.focus();
        if (selection && ranges.length) {
            selection.removeAllRanges();
            ranges.forEach(range => selection.addRange(range));
        }
    }
    
    // 处理代码块的复制按钮
    setupCodeBlockCopyButtons();
    
    // 恢复滚动位置
    if (wasScrolledToBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

// 在接收到AI响应时处理思考内容
function handleThinkingContent(thinking, messageContainer) {
    // 使用ThinkingHandler处理思考内容
    if (thinking && thinking.trim() !== '') {
        thinkingHandler.handleThinking(thinking, messageContainer);
    }
}

// 处理AI回复
async function handleAIReply(prompt, isFollowUp, messageHistory, thinking) {
    // ... existing code ...
    
    // 创建AI消息容器
    const aiMsg = document.createElement('div');
    aiMsg.className = 'message ai-message';
    
    // 处理思考内容
    if (thinking && thinking.trim() !== '') {
        handleThinkingContent(thinking, aiMsg);
    }
    
    // ... existing code ...
}