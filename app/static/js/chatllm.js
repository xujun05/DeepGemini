// ChatLLM Interface Logic
document.addEventListener("DOMContentLoaded", function() {
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
            // 确保加载状态初始隐藏
            hideLoading();
            
            // 并行初始化所有选择器以提高性能
            await Promise.allSettled([
                loadModels(),
                loadConfigurations(),
                loadRoles(),
                loadGroups()
            ]);
            
            // 默认设置单模型模式
            setActiveChatMode('single');
        } catch (error) {
            console.error('初始化失败:', error);
            if (chatMessages) {
                addMessageToChat('system', '初始化失败: ' + error.message);
            }
        } finally {
            // 无论成功失败都隐藏加载状态
            hideLoading();
            
            // 额外确保一次加载状态被隐藏
            setTimeout(hideLoading, 500);
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
            
            // 获取配置详情以提取配置名称（备份尝试）
            let configName = configId;  // 默认使用ID
            try {
                const configResponse = await fetch(`/v1/configurations/${configId}`);
                if (configResponse.ok) {
                    const configData = await configResponse.json();
                    configName = configData.name;  // 使用配置名称
                }
            } catch (e) {
                console.warn(`备份尝试获取配置信息失败: ${e}`);
            }
            
            // 回退到非流式请求
            const fallbackResponse = await fetch('/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}`
                },
                body: JSON.stringify({
                    model: configName,  // 使用配置名称而不是ID
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
        const groupId = discussionGroupSelect.value;
        const topic = discussionTopic.value.trim();
        
        if (!topic) {
            hideLoading();
            alert('请输入讨论主题');
            return;
        }
        
        // 获取API密钥 - 使用默认或从localStorage获取
        const apiKey = getCurrentApiKey();
        
        // 如果还没有讨论，则创建一个新的讨论
        if (!currentMeetingId) {
            // 创建新讨论
            const startResponse = await fetch('/api/meeting/discussions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${apiKey}` // 添加API密钥到请求头
                },
                body: JSON.stringify({
                    group_id: parseInt(groupId),
                    topic: topic
                })
            });
            
            // 处理响应状态
            if (!startResponse.ok) {
                // 当状态码不是2xx时
                if (startResponse.status === 401) {
                    throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
                } else {
                    throw new Error(`服务器错误: ${startResponse.status} ${startResponse.statusText}`);
                }
            }
            
            const startData = await startResponse.json();
            currentMeetingId = startData.meeting_id;
            
            // 添加系统消息
            addMessageToChat('system', `已创建讨论: ${topic}`);
            
            // 加载人类角色
            await loadHumanRoles();
        }
        
        // 添加用户输入到讨论中
        const inputResponse = await fetch(`/api/meeting/discussions/${currentMeetingId}/human_input`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${apiKey}` // 添加API密钥到请求头
            },
            body: JSON.stringify({
                agent_name: "User",
                message: message
            })
        });
        
        // 处理响应状态
        if (!inputResponse.ok) {
            // 当状态码不是2xx时
            if (inputResponse.status === 401) {
                throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
            } else {
                throw new Error(`服务器错误: ${inputResponse.status} ${inputResponse.statusText}`);
            }
        }
        
        await inputResponse.json();
        
        // 执行一轮讨论
        const roundResponse = await fetch(`/api/meeting/discussions/${currentMeetingId}/round`, {
            method: 'POST',
            headers: {
                'Authorization': `${apiKey}` // 添加API密钥到请求头
            }
        });
        
        // 处理响应状态
        if (!roundResponse.ok) {
            // 当状态码不是2xx时
            if (roundResponse.status === 401) {
                throw new Error('API密钥无效或未提供，请检查您的API密钥设置');
            } else {
                throw new Error(`服务器错误: ${roundResponse.status} ${roundResponse.statusText}`);
            }
        }
        
        const roundData = await roundResponse.json();
        
        // 获取讨论消息
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
            } else {
                throw new Error(`服务器错误: ${messagesResponse.status} ${messagesResponse.statusText}`);
            }
        }
        
        const messagesData = await messagesResponse.json();
        
        // 更新聊天界面
        updateDiscussionChat(messagesData);
        
        // 检查是否需要人类输入
        await checkForHumanInput();
    }
    
    // 加载人类角色
    async function loadHumanRoles() {
        try {
            // 获取API密钥 - 使用默认或从localStorage获取
            const apiKey = getCurrentApiKey();
            
            const response = await fetch(`/api/meeting/discussions/${currentMeetingId}/human_roles`, {
                headers: {
                    'Authorization': `${apiKey}` // 添加API密钥到请求头
                }
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
            
            humanRoles = await response.json();
            
            // 如果有人类角色，设置初始值
            if (humanRoles.length > 0) {
                humanRoleName.textContent = humanRoles[0].name;
            }
        } catch (error) {
            console.error('加载人类角色失败:', error);
        }
    }
    
    // 检查是否需要人类输入
    async function checkForHumanInput() {
        try {
            // 获取API密钥 - 使用默认或从localStorage获取
            const apiKey = getCurrentApiKey();
            
            // 获取会议消息以检查状态
            const response = await fetch(`/api/meeting/discussions/${currentMeetingId}/messages`, {
                headers: {
                    'Authorization': `${apiKey}` // 添加API密钥到请求头
                }
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
            
            const data = await response.json();
            
            // 检查是否有待处理的人类输入
            const waitingForHuman = data.status === "waiting_for_human" || 
                                   (data.waiting_for_human && data.waiting_for_human.length > 0);
            
            if (waitingForHuman) {
                isWaitingForHumanInput = true;
                
                // 显示人类输入区域
                humanInputArea.classList.remove('d-none');
                
                // 检查哪个角色需要输入
                if (data.waiting_for_human && data.waiting_for_human.length > 0) {
                    const humanRole = data.waiting_for_human[0];
                    humanRoleName.textContent = humanRole.name || "人类";
                }
                
                // 隐藏正常的聊天输入
                document.querySelector('.chat-input').classList.add('d-none');
            } else {
                isWaitingForHumanInput = false;
                humanInputArea.classList.add('d-none');
                document.querySelector('.chat-input').classList.remove('d-none');
            }
        } catch (error) {
            console.error('检查人类输入失败:', error);
        }
    }
    
    // 发送人类输入
    async function sendHumanInput() {
        const message = humanInputMessage.value.trim();
        if (!message || !currentMeetingId) return;
        
        try {
            showLoading();
            
            // 获取当前人类角色名称
            const roleName = humanRoleName.textContent;
            
            // 发送人类输入
            const response = await fetch(`/api/meeting/discussions/${currentMeetingId}/human_input`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agent_name: roleName,
                    message: message
                })
            });
            
            await response.json();
            
            // 执行下一轮讨论
            const roundResponse = await fetch(`/api/meeting/discussions/${currentMeetingId}/round`, {
                method: 'POST'
            });
            
            await roundResponse.json();
            
            // 获取更新的讨论消息
            const messagesResponse = await fetch(`/api/meeting/discussions/${currentMeetingId}/messages`);
            const messagesData = await messagesResponse.json();
            
            // 更新聊天界面
            updateDiscussionChat(messagesData);
            
            // 重置人类输入
            humanInputMessage.value = '';
            
            // 检查是否需要更多人类输入
            await checkForHumanInput();
        } catch (error) {
            console.error('发送人类输入失败:', error);
            addMessageToChat('system', '发送失败: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    // 构建聊天消息历史
    function buildChatMessages(newMessage) {
        const messages = [...messageHistory];
        messages.push({ role: 'user', content: newMessage });
        return messages;
    }
    
    // 添加消息到聊天界面
    function addMessageToChat(role, content) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message-container', role);
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // 使用 marked 渲染 Markdown
        messageContent.innerHTML = marked.parse(content);
        
        messageEl.appendChild(messageContent);
        chatMessages.appendChild(messageEl);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 更新讨论组聊天界面
    function updateDiscussionChat(data) {
        // 清空当前消息
        chatMessages.innerHTML = '';
        
        // 添加讨论主题
        const topicEl = document.createElement('div');
        topicEl.classList.add('discussion-topic');
        topicEl.innerHTML = `<h3>讨论主题: ${data.topic}</h3>`;
        chatMessages.appendChild(topicEl);
        
        // 添加各轮次的消息
        if (data.rounds && data.rounds.length > 0) {
            data.rounds.forEach((round, roundIndex) => {
                // 创建轮次容器
                const roundEl = document.createElement('div');
                roundEl.classList.add('discussion-round');
                
                // 添加轮次标题
                const roundTitle = document.createElement('div');
                roundTitle.classList.add('discussion-round-title');
                roundTitle.textContent = `第 ${roundIndex + 1} 轮讨论`;
                roundEl.appendChild(roundTitle);
                
                // 添加轮次中的消息
                if (round.messages && round.messages.length > 0) {
                    round.messages.forEach(message => {
                        const agentEl = document.createElement('div');
                        agentEl.classList.add('agent-message');
                        
                        const agentHeader = document.createElement('div');
                        agentHeader.classList.add('agent-header');
                        
                        const agentName = document.createElement('div');
                        agentName.classList.add('agent-name');
                        agentName.textContent = message.agent_name;
                        
                        const agentBadge = document.createElement('div');
                        agentBadge.classList.add('agent-badge');
                        
                        // 判断是否是人类消息
                        const isHuman = humanRoles.some(role => role.name === message.agent_name);
                        agentBadge.textContent = isHuman ? '人类' : 'AI';
                        
                        agentHeader.appendChild(agentName);
                        agentHeader.appendChild(agentBadge);
                        
                        const agentContent = document.createElement('div');
                        agentContent.classList.add('agent-content');
                        agentContent.innerHTML = marked.parse(message.content);
                        
                        agentEl.appendChild(agentHeader);
                        agentEl.appendChild(agentContent);
                        roundEl.appendChild(agentEl);
                    });
                }
                
                chatMessages.appendChild(roundEl);
            });
        }
        
        // 如果有系统消息，显示它们
        if (data.system_messages && data.system_messages.length > 0) {
            data.system_messages.forEach(msg => {
                const systemEl = document.createElement('div');
                systemEl.classList.add('message-container', 'system');
                
                const systemContent = document.createElement('div');
                systemContent.classList.add('message-content');
                systemContent.textContent = msg;
                
                systemEl.appendChild(systemContent);
                chatMessages.appendChild(systemEl);
            });
        }
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
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