// ChatLLM Interface Logic
document.addEventListener("DOMContentLoaded", function() {
    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
    /* 人类角色相关样式 */
    .human-message {
        border-left: 4px solid #007bff;
        background-color: rgba(0, 123, 255, 0.05);
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
            
            // 填充单模型选择器
            if (singleModelSelect) {
                let options = '';
                data.forEach(model => {
                    options += `<option value="${model.id}">${model.name}</option>`;
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
            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            messageContainer.appendChild(messageContent);
            chatMessages.appendChild(messageContainer);
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // 保存完整响应内容
            let fullContent = '';
            
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
                                const delta = data.choices[0].delta.content || '';
                                fullContent += delta;
                                
                                // 更新消息内容
                                messageContent.innerHTML = marked.parse(fullContent);
                                
                                // 滚动到底部
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    }
                }
            }
            
            // 更新消息历史
            messageHistory.push({ role: 'user', content: message });
            messageHistory.push({ role: 'assistant', content: fullContent });
            
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
                addMessageToChat('ai', aiMessage);
                
                // 更新消息历史
                messageHistory.push({ role: 'user', content: message });
                messageHistory.push({ role: 'assistant', content: aiMessage });
                
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
            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            messageContainer.appendChild(messageContent);
            chatMessages.appendChild(messageContainer);
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // 保存完整响应内容
            let fullContent = '';
            
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let currentSpeaker = null;
            let speakerContent = '';
            let speakerContainer = null;
            let speakerContentElement = null;
            
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
                                const delta = data.choices[0].delta.content || '';
                                
                                // 检查是否有新发言人标记 "### 名称 发言："
                                const speakerMatch = delta.match(/###\s+(.+?)\s+发言：/);
                                
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
                                    
                                    // 检查是否是人类角色（特别是小明）
                                    const isHumanRole = currentSpeaker === "小明" || 
                                                      humanRoles.some(role => role.name === currentSpeaker);
                                    
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
                                    }
                                } 
                                // 检查是否有会议结束和总结标记
                                else if (delta.includes("## 会议结束") || delta.includes("会议总结") || delta.includes("## 会议总结")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到会议结束或总结标记: ", delta);
                                    
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
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                                // 当已经在显示总结内容时，继续累积总结内容
                                else if (currentSpeaker === "总结") {
                                    console.log("正在累积总结内容: " + delta.substring(0, 30) + (delta.length > 30 ? "..." : ""));
                                    speakerContent += delta;
                                    
                                    // 更新总结内容
                                    if (speakerContentElement) {
                                        speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        // 滚动到底部
                                        chatMessages.scrollTop = chatMessages.scrollHeight;
                                    }
                                } 
                                // 检查"等待人类输入"标记
                                else if (delta.includes("等待人类输入") || delta.includes("waiting for human input")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到等待人类输入的提示");
                                    // 立即检查人类输入状态
                                    await checkForHumanInput();
                                }
                                // 常规内容更新
                                else {
                                    if (currentSpeaker) {
                                        // 如果有当前发言人，添加到发言人内容
                                        speakerContent += delta;
                                        
                                        // 检查是否包含特定的人类角色等待输入标记
                                        if (speakerContent.includes("等待人类输入") && currentSpeaker === "小明") {
                                            console.log("小明角色需要输入");
                                            
                                            // 设置人类角色名称
                                            humanRoleName.textContent = currentSpeaker;
                                            
                                            // 强制显示人类输入区域
                                            isWaitingForHumanInput = true;
                                            humanInputArea.classList.remove('d-none');
                                            document.querySelector('.chat-input').classList.add('d-none');
                                            
                                            // 聚焦到输入框
                                            humanInputMessage.focus();
                                        }
                                        
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        }
                                    } else {
                                        // 如果没有当前发言人，使用普通消息容器显示
                                        fullContent += delta;
                                        messageContent.innerHTML = marked.parse(fullContent);
                                    }
                                }
                                
                                // 滚动到底部
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    } else if (line === 'data: [DONE]') {
                        console.log('讨论完成');
                        
                        // 如果整个响应中没有检测到特殊格式，确保内容显示在普通消息容器中
                        if (!hasSpecialFormat && fullContent) {
                            console.log('没有检测到特殊格式，将内容显示在普通消息中');
                            messageContent.innerHTML = marked.parse(fullContent);
                        }
                        
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
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // 保存完整响应内容
            let fullContent = '';
            
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
                                const delta = data.choices[0].delta.content || '';
                                fullContent += delta;
                                
                                // 更新消息内容
                                messageContent.innerHTML = marked.parse(fullContent);
                                
                                // 滚动到底部
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    }
                }
            }
            
            // 更新消息历史
            messageHistory.push({ role: 'user', content: message });
            messageHistory.push({ role: 'assistant', content: fullContent });
            
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
                addMessageToChat('ai', aiMessage);
                
                // 更新消息历史
                messageHistory.push({ role: 'user', content: message });
                messageHistory.push({ role: 'assistant', content: aiMessage });
                
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
            let speakerContainer = null;
            let speakerContentElement = null;
            
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
                                const delta = data.choices[0].delta.content || '';
                                
                                // 检查是否有新发言人标记 "### 名称 发言："
                                const speakerMatch = delta.match(/###\s+(.+?)\s+发言：/);
                                
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
                                    
                                    // 检查是否是人类角色（特别是小明）
                                    const isHumanRole = currentSpeaker === "小明" || 
                                                      humanRoles.some(role => role.name === currentSpeaker);
                                    
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
                                    }
                                } 
                                // 检查是否有会议结束和总结标记
                                else if (delta.includes("## 会议结束") || delta.includes("会议总结") || delta.includes("## 会议总结")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到会议结束或总结标记: ", delta);
                                    
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
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                                // 当已经在显示总结内容时，继续累积总结内容
                                else if (currentSpeaker === "总结") {
                                    console.log("正在累积总结内容: " + delta.substring(0, 30) + (delta.length > 30 ? "..." : ""));
                                    speakerContent += delta;
                                    
                                    // 更新总结内容
                                    if (speakerContentElement) {
                                        speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        // 滚动到底部
                                        chatMessages.scrollTop = chatMessages.scrollHeight;
                                    }
                                } 
                                // 检查"等待人类输入"标记
                                else if (delta.includes("等待人类输入") || delta.includes("waiting for human input")) {
                                    hasSpecialFormat = true; // 标记检测到特殊格式
                                    
                                    console.log("检测到等待人类输入的提示");
                                    // 立即检查人类输入状态
                                    await checkForHumanInput();
                                }
                                // 常规内容更新
                                else {
                                    if (currentSpeaker) {
                                        // 如果有当前发言人，添加到发言人内容
                                        speakerContent += delta;
                                        
                                        // 检查是否包含特定的人类角色等待输入标记
                                        if (speakerContent.includes("等待人类输入") && currentSpeaker === "小明") {
                                            console.log("小明角色需要输入");
                                            
                                            // 设置人类角色名称
                                            humanRoleName.textContent = currentSpeaker;
                                            
                                            // 强制显示人类输入区域
                                            isWaitingForHumanInput = true;
                                            humanInputArea.classList.remove('d-none');
                                            document.querySelector('.chat-input').classList.add('d-none');
                                            
                                            // 聚焦到输入框
                                            humanInputMessage.focus();
                                        }
                                        
                                        if (speakerContentElement) {
                                            speakerContentElement.innerHTML = marked.parse(speakerContent);
                                        }
                                    } else {
                                        // 如果没有当前发言人，使用普通消息容器显示
                                        fullContent += delta;
                                        messageContent.innerHTML = marked.parse(fullContent);
                                    }
                                }
                                
                                // 滚动到底部
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    } else if (line === 'data: [DONE]') {
                        console.log('讨论完成');
                        
                        // 如果整个响应中没有检测到特殊格式，确保内容显示在普通消息容器中
                        if (!hasSpecialFormat && fullContent) {
                            console.log('没有检测到特殊格式，将内容显示在普通消息中');
                            messageContent.innerHTML = marked.parse(fullContent);
                        }
                        
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
                    systemContent.includes("请输入") ||
                    systemContent.includes("等待小明") ||
                    systemContent.includes("轮到小明") ||
                    systemContent.includes("小明的回合")) {
                    
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
                
                // 特别处理"小明"角色 - 更全面的检测
                if (humanRoles.some(role => role.name === "小明")) {
                    // 检查是否明确提到小明需要发言
                    if ((content.includes("小明该发言") || 
                         content.includes("轮到小明") || 
                         content.includes("该小明发言") || 
                         content.includes("小明发言") ||
                         content.includes("小明的回合") ||
                         content.includes("小明请") ||
                         content.includes("请小明") ||
                         content.includes("等待小明") ||
                         content.includes("需要小明") ||
                         content.includes("小明回答") ||
                         content.includes("小明应该") ||
                         (content.includes("小明") && content.includes("问题"))) &&
                        !content.includes("小明：") && 
                        !content.includes("小明:")) {
                        
                        showHumanInputArea("小明");
                        console.log(`检测到需要小明输入`);
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
        // 特别针对"小明"角色的特殊处理
        if (humanName === "小明") {
            // 在轮流讨论模式下，如果最近的发言者是讨论的前一个角色，可能接下来是小明
            if (mode === "discussion" || mode === "debate") {
                // 获取聊天历史中所有发言者的顺序
                const allSpeakers = Array.from(document.querySelectorAll('.chat-message'))
                    .map(msg => {
                        const speakerName = msg.querySelector('.message-sender')?.textContent.replace(':', '').trim();
                        return speakerName;
                    })
                    .filter(Boolean);
                
                // 查找小明在发言顺序中的位置模式
                if (allSpeakers.length >= 5) {
                    // 查找是否有一个固定的发言顺序
                    const speakingPattern = allSpeakers.slice(-5);
                    const smallMingIndex = speakingPattern.indexOf("小明");
                    
                    // 如果找到小明在最近的发言序列中
                    if (smallMingIndex >= 0) {
                        // 计算小明前面的发言者
                        const previousSpeaker = smallMingIndex > 0 
                            ? speakingPattern[smallMingIndex - 1] 
                            : speakingPattern[speakingPattern.length - 1];
                        
                        // 如果最后一个发言者是小明前面的发言者，则可能接下来是小明
                        if (speakers[speakers.length - 1] === previousSpeaker) {
                            return true;
                        }
                    }
                }
            }
        }
        
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
                                        chatMessages.scrollTop = chatMessages.scrollHeight;
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
                                            chatMessages.scrollTop = chatMessages.scrollHeight;
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
                                            chatMessages.scrollTop = chatMessages.scrollHeight;
                                            
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
                                            chatMessages.scrollTop = chatMessages.scrollHeight;
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
        
        // 添加名称元素（如果有）
        if (speakerName || role === 'ai') {
            const nameElement = document.createElement('div');
            nameElement.classList.add('message-name');
            nameElement.textContent = speakerName || (role === 'ai' ? '助手' : role === 'user' ? '用户' : '系统');
            messageContainer.appendChild(nameElement);
        }
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // 使用markdown渲染内容，使得代码和格式更好看
        messageContent.innerHTML = marked.parse(content);
        
        // 为代码块添加主题适配
        if (document.body.classList.contains('dark-theme')) {
            const codeBlocks = messageContent.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                block.classList.add('dark-code');
            });
        }
        
        messageContainer.appendChild(messageContent);
        chatMessages.appendChild(messageContainer);
        
        console.log(`添加消息到聊天: 角色=${role}, 发言者=${speakerName || '未指定'}, ID=${messageId}`);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageId;
    }
    
    // 更新讨论组聊天界面
    function updateDiscussionChat(data) {
        if (!data || !data.messages) {
            return;
        }
        
        // 清理定时刷新，如果会议已结束
        if (data.status === "已结束") {
            console.log("会议已结束，停止定时刷新");
            if (window.refreshTimer) {
                clearTimeout(window.refreshTimer);
                window.refreshTimer = null;
            }
            
            // 不要发送额外的结束请求
            currentMeetingId = null;
        }
        
        // 获取聊天消息容器
        const messagesContainer = document.getElementById('chat-messages');
        
        // 清空当前显示
        // messagesContainer.innerHTML = '';  // 不再清空，避免丢失流式内容
        
        // 记录是否添加了总结
        let summaryAdded = false;
        
        // 添加新消息到容器
        data.messages.forEach(message => {
            // 检查消息类型
            const role = message.role;
            const agent = message.agent_name || '';
            const content = message.content || '';
            
            // 检查是否是系统消息且像是总结
            if (role === 'system' && agent === 'system' && content.length > 100) {
                // 查找已经存在的总结消息
                const existingSummaries = document.querySelectorAll('.summary-message');
                if (existingSummaries.length === 0) {
                    // 创建总结消息元素
                    const summaryElement = document.createElement('div');
                    summaryElement.className = 'system-message summary-message';
                    summaryElement.innerHTML = `
                        <div class="message-header">
                            <strong>会议总结</strong>
                        </div>
                        <div class="message-content">
                            ${marked.parse(content)}
                        </div>
                    `;
                    messagesContainer.appendChild(summaryElement);
                    summaryAdded = true;
                    
                    // 滚动到最新消息
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        });
        
        // 如果有待处理的人类输入
        if (data.waiting_for_human && data.waiting_for_human.length > 0) {
            // 显示人类输入界面
            const humanRole = data.waiting_for_human[0];
            showHumanInputArea(humanRole.name);
        } else {
            // 隐藏人类输入界面
            document.getElementById('human-input-area').style.display = 'none';
        }
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
    
    // 仅设置等待人类输入状态，不创建可能覆盖前一个发言的提示
    function showWaitingForHumanInput(roleName) {
        console.log(`====== 显示等待人类输入状态开始 - 角色: ${roleName} ======`);
        
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
        const chatContainer = document.getElementById('chat-messages');
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
});

// 修复侧边栏导航
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
} 

// 添加一个新函数来专门获取会议总结
async function fetchMeetingSummary(meetingId) {
    if (!meetingId) {
        console.log("无法获取总结：会议ID不存在");
        return;
    }
}