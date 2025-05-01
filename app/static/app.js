// Global variables
let models = [];
let configurations = [];
let stepCounter = 0;
let availableModels = [];
let isManualModelInput = false;
let apiKeys = [];
let paramCounter = 0;

// Translations object
const translations = {
    en: {
        modelManagement: 'Model Management',
        workflowManagement: 'Relay Chain Management',
        systemSettings: 'System Settings',
        addNewModel: 'Add New Model',
        addNewWorkflow: 'Add New Relay Chain',
        workflowDescription: 'Configure and manage your AI model relay chains',
        language: 'Language',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        steps: 'Steps',
        reasoning: 'Reasoning',
        execution: 'Execution',
        active: 'Active',
        inactive: 'Inactive',
        edit: 'Edit',
        duplicate: 'Duplicate',
        delete: 'Delete',
        preview: 'Preview',
        save: 'Save',
        close: 'Close',
        configName: 'Configuration Name',
        systemPrompt: 'System Prompt',
        modelSelection: 'Model Selection',
        stepType: 'Step Type',
        stepOrder: 'Step Order',
        customName: 'Custom Name',
        customNamePlaceholder: 'Enter a custom name for this model',
        apiKey: 'API Key',
        apiUrl: 'API URL',
        modelName: 'Model Name',
        modelNamePlaceholder: 'Please enter API credentials first',
        type: 'Type',
        provider: 'Provider[Reasoning model, select the owner]',
        temperature: 'Temperature',
        topP: 'Top P',
        presencePenalty: 'Presence Penalty',
        frequencyPenalty: 'Frequency Penalty',
        maxTokens: 'Max Tokens',
        optionalSystemPrompt: 'System Prompt (Optional)',
        systemPromptPlaceholder: 'Enter system prompt to guide the model\'s behavior',
        addStep: 'Add Step',
        removeStep: 'Remove Step',
        step: 'Step',
        visualizeWorkflow: 'Relay Chain Visualization',
        apiKeyManagement: 'API Key Management',
        generalSettings: 'General Settings',
        advancedSettings: 'Advanced Settings',
        addNewApiKey: 'Add New API Key',
        description: 'Description',
        generate: 'Generate',
        apiKeyFormat: 'Format: sk-api-xxxxxxxxxx',
        apiKeyGenerated: 'API key generated',
        apiKeyInvalid: 'Invalid API key format. Should start with "sk-api-"',
        copy: 'Copy',
        noApiKeys: 'No API keys available',
        workflowName: 'Workflow Name',
        workflowStatus: 'Status',
        saved: 'Saved',
        saving: 'Saving...',
        copied: 'Copied',
        deleted: 'Deleted',
        confirmDelete: 'Confirm deletion?',
        passwordUpdated: 'Password updated',
        passwordMismatch: 'Passwords do not match',
        operationSuccess: 'Operation successful',
        operationFailed: 'Operation failed',
        accountSettings: 'Account Settings',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        updatePassword: 'Update Password',
        transferContent: 'Transfer Content',
        editWorkflow: 'Edit Workflow',
        deleteWorkflow: 'Delete Workflow',
        selectModel: 'Select Model',
        adminCredentials: 'Admin Credentials',
        newUsername: 'New Username',
        updateCredentials: 'Update Credentials',
        logout: 'Logout',
        logoutConfirm: 'Are you sure you want to logout?',
        customParameters: 'Custom Parameters',
        addParameter: 'Add Parameter',
        parameterName: 'Parameter Name',
        parameterValue: 'Parameter Value',
        parameterType: 'Parameter Type',
        removeParameter: 'Remove',
        string: 'String',
        number: 'Number',
        boolean: 'Boolean',
        summaryModel: 'Summary Model',
        useDefaultModel: 'Use Default Model',
        customSummaryPrompt: 'Custom Summary Prompt (Optional)',
        summaryPromptTip: 'You can use placeholders like {topic}, {history_text}, {meeting_topic}',
        summaryModelHint: 'Select a model for generating meeting summaries, leave empty to use system default',
        insertTemplate: 'Insert Template',
        promptTemplateCopied: 'Template inserted in the textarea',
        maxRounds: 'Maximum Discussion Rounds',
        maxRoundsHint: 'Set the maximum number of discussion rounds between AI agents, each agent speaks once per round',
        customSpeakingOrder: 'Custom Speaking Order',
        customSpeakingOrderHint: 'Drag role cards to adjust speaking order. This setting only applies to Discussion, Brainstorming, Role Playing, and SWOT Analysis modes.',
        
        // 角色管理相关翻译
        roleManagement: 'Role Management',
        roleDescription: 'Role Description',
        addRole: 'Add Role',
        roleName: 'Role Name',
        personality: 'Personality',
        skills: 'Skills',
        noDescription: 'No description',
        noPersonality: 'No personality traits',
        noSkills: 'No skills',
        defaultModel: 'Default model',
        addNewRole: 'Add New Role',
        editRole: 'Edit Role',
        deleteRole: 'Delete Role',
        confirmDeleteRole: 'Are you sure you want to delete this role?',
        roleDeleted: 'Role successfully deleted',
        roleDeleteFailed: 'Failed to delete role',
        roleAdded: 'Role successfully added',
        roleUpdated: 'Role successfully updated',
        roleSaveFailed: 'Failed to save role',
        
        // 讨论组管理相关翻译
        groupManagement: 'Discussion Group Management',
        groupDescription: 'Create and manage AI role discussion groups for multi-roles conversations',
        addGroup: 'Add Group',
        groupName: 'Group Name',
        meetingMode: 'Meeting Mode',
        roleCount: 'roles',
        rounds: 'rounds',
        addNewGroup: 'Add New Discussion Group',
        editGroup: 'Edit Discussion Group',
        deleteGroup: 'Delete Discussion Group',
        confirmDeleteGroup: 'Are you sure you want to delete this discussion group?',
        groupDeleted: 'Discussion group successfully deleted',
        groupDeleteFailed: 'Failed to delete discussion group',
        groupAdded: 'Discussion group successfully added',
        groupUpdated: 'Discussion group successfully updated',
        groupSaveFailed: 'Failed to save discussion group',
        
        // 会议模式
        discussion: 'General Discussion',
        brainstorming: 'Brainstorming',
        debate: 'Debate',
        rolePlaying: 'Role Playing',
        swotAnalysis: 'SWOT Analysis',
        sixThinkingHats: 'Six Thinking Hats',
        isHuman: "Human Role",
        isHumanHint: "Check if this is a human-controlled role that requires user input during discussions",
        hostRole: "Host Role",
        noHostRole: "None (Independent role)",
        hostRoleHint: "Select the AI role this human will parasitize, human will speak instead of this AI",
        humanInput: "Human Input",
        submitMessage: "Submit Message",
        waitingForInput: "Waiting for your input...",
        interruptMeeting: "Interrupt Meeting",
        yourMessage: "Your message",
        
        // 聊天界面相关翻译
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
        welcomeToChat: 'ChatDeepGemini',
        chatInstructions: 'Select a chat mode and start the conversation',
        speakingAs: 'Speaking as ',
        identity: '',
        submitMessage: 'Submit Message',
        startDiscussion: 'Start Discussion'
    },
    zh: {
        modelManagement: '模型管理',
        workflowManagement: '接力链管理',
        systemSettings: '系统设置',
        addNewModel: '添加新模型',
        addNewWorkflow: '添加新接力链',
        workflowDescription: '配置和管理您的 AI 模型接力链',
        language: '语言',
        darkMode: '夜间模式',
        lightMode: '日间模式',
        steps: '步骤',
        reasoning: '推理',
        execution: '执行',
        active: '已启用',
        inactive: '已禁用',
        edit: '编辑',
        duplicate: '复制',
        delete: '删除',
        preview: '预览',
        save: '保存',
        close: '关闭',
        configName: '配置名称',
        systemPrompt: '系统提示词',
        modelSelection: '模型选择',
        stepType: '步骤类型',
        stepOrder: '步骤顺序',
        customName: '自定义名称',
        customNamePlaceholder: '请输入模型的自定义名称',
        apiKey: 'API 密钥',
        apiUrl: 'API 地址',
        modelName: '模型名称',
        modelNamePlaceholder: '请先输入 API 凭证',
        type: '类型',
        provider: '提供者[推理模型，选择所有者]',
        temperature: '温度',
        topP: 'Top P',
        presencePenalty: '存在惩罚',
        frequencyPenalty: '频率惩罚',
        maxTokens: '最大令牌数',
        optionalSystemPrompt: '系统提示词（可选）',
        systemPromptPlaceholder: '输入系统提示词以指导模型的行为',
        addStep: '添加步骤',
        removeStep: '删除步骤',
        step: '步骤',
        visualizeWorkflow: '接力链可视化',
        apiKeyManagement: 'API 密钥管理',
        generalSettings: '通用设置',
        advancedSettings: '高级设置',
        addNewApiKey: '添加新 API 密钥',
        description: '描述',
        generate: '生成',
        apiKeyFormat: '格式：sk-api-xxxxxxxxxx',
        apiKeyGenerated: 'API 密钥已生成',
        apiKeyInvalid: 'API 密钥格式无效。应以"sk-api-"开头',
        copy: '复制',
        noApiKeys: '没有可用的 API 密钥',
        workflowName: '工作流名称',
        workflowStatus: '状态',
        saved: '已保存',
        saving: '保存中...',
        copied: '已复制',
        deleted: '已删除',
        confirmDelete: '确认删除？',
        passwordUpdated: '密码已更新',
        passwordMismatch: '密码不匹配',
        operationSuccess: '操作成功',
        operationFailed: '操作失败',
        accountSettings: '账户设置',
        changePassword: '更改密码',
        currentPassword: '当前密码',
        newPassword: '新密码',
        confirmPassword: '确认密码',
        updatePassword: '更新密码',
        transferContent: '传输内容',
        editWorkflow: '编辑工作流',
        deleteWorkflow: '删除工作流',
        selectModel: '选择模型',
        adminCredentials: '管理员凭证',
        newUsername: '新用户名',
        updateCredentials: '更新凭证',
        logout: '退出登录',
        logoutConfirm: '您确定要退出登录吗？',
        customParameters: '自定义参数',
        addParameter: '添加参数',
        parameterName: '参数名称',
        parameterValue: '参数值',
        parameterType: '参数类型',
        removeParameter: '删除',
        string: '字符串',
        number: '数字',
        boolean: '布尔值',
        summaryModel: '总结模型',
        useDefaultModel: '使用默认模型',
        customSummaryPrompt: '自定义总结提示（可选）',
        summaryPromptTip: '您可以使用占位符如 {topic}, {history_text}, {meeting_topic}',
        summaryModelHint: '选择用于生成会议总结的模型，留空则使用系统默认模型',
        insertTemplate: '插入模板',
        promptTemplateCopied: '模板已插入文本框',
        maxRounds: '最大讨论轮数',
        maxRoundsHint: '设置AI智能体之间的最大讨论轮数，每轮每个智能体会发言一次',
        customSpeakingOrder: '自定义发言顺序',
        customSpeakingOrderHint: '拖动角色卡片调整发言顺序。此设置仅适用于普通讨论、头脑风暴、角色扮演和SWOT分析模式。',
        
        // 角色管理相关翻译
        roleManagement: '角色管理',
        roleDescription: '角色描述',
        addRole: '添加角色',
        roleName: '角色名称',
        personality: '性格特点',
        skills: '技能',
        noDescription: '无描述',
        noPersonality: '无性格特点',
        noSkills: '无技能',
        defaultModel: '默认模型',
        addNewRole: '添加新角色',
        editRole: '编辑角色',
        deleteRole: '删除角色',
        confirmDeleteRole: '您确定要删除此角色吗？',
        roleDeleted: '角色已成功删除',
        roleDeleteFailed: '删除角色失败',
        roleAdded: '角色已成功添加',
        roleUpdated: '角色已成功更新',
        roleSaveFailed: '保存角色失败',
        
        // 讨论组管理相关翻译
        groupManagement: '讨论组管理',
        groupDescription: '创建和管理AI角色讨论组，用于多角色对话',
        addGroup: '添加讨论组',
        groupName: '讨论组名称',
        meetingMode: '会议模式',
        roleCount: '个角色',
        rounds: '轮',
        addNewGroup: '添加新讨论组',
        editGroup: '编辑讨论组',
        deleteGroup: '删除讨论组',
        confirmDeleteGroup: '您确定要删除此讨论组吗？',
        groupDeleted: '讨论组已成功删除',
        groupDeleteFailed: '删除讨论组失败',
        groupAdded: '讨论组已成功添加',
        groupUpdated: '讨论组已成功更新',
        groupSaveFailed: '保存讨论组失败',
        
        // 会议模式
        discussion: '一般讨论',
        brainstorming: '头脑风暴',
        debate: '辩论',
        rolePlaying: '角色扮演',
        swotAnalysis: 'SWOT分析',
        sixThinkingHats: '六顶思考帽',
        isHuman: "人类角色",
        isHumanHint: "勾选此项表示这是一个由人类控制的角色，在讨论过程中需要用户输入",
        hostRole: "宿主角色",
        noHostRole: "无（独立角色）",
        hostRoleHint: "选择此人类将寄生的AI角色，人类将替代该AI发言(beta)",
        humanInput: "人类输入",
        submitMessage: "提交消息",
        waitingForInput: "等待您的输入...",
        interruptMeeting: "中断会议",
        yourMessage: "您的消息",
        
        // 聊天界面相关翻译
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
        welcomeToChat: 'ChatDeepGemini',
        chatInstructions: '选择聊天模式并开始对话',
        speakingAs: '正在以',
        identity: '身份发言',
        submitMessage: '提交发言',
        startDiscussion: '开始讨论'
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    loadModels();
    loadConfigurations();
    
    // 初始化语言
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    document.getElementById('languageSelect').value = savedLang;
    document.getElementById('languageSelectPopup').value = savedLang;
    changeLanguage(savedLang);
    
    // 初始化语言 - 使用正确的方法
    applyLanguage(getCurrentLanguage());
    
    // 初始化主题
    const savedTheme = localStorage.getItem('dark_theme');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-theme');
        const darkModeControl = document.querySelector('.dark-mode-control');
        darkModeControl.classList.add('dark');
        
        // 初始化时也更新文字
        const darkModeText = darkModeControl.querySelector('[data-translate="darkMode"]');
        darkModeText.textContent = savedLang === 'zh' ? '日间模式' : 'Light Mode';
    }

    // 检查URL参数，处理从其他页面的导航
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    if (pageParam) {
        // 找到对应的菜单项并激活它
        const menuItem = document.querySelector(`.sidebar-menu li[data-page="${pageParam}"]`);
        if (menuItem) {
            // 移除所有菜单项的active类
            document.querySelectorAll('.sidebar-menu li').forEach(item => item.classList.remove('active'));
            // 添加active类到目标菜单项
            menuItem.classList.add('active');
            
            // 显示对应的页面
            const pageId = pageParam + '-page';
            document.querySelectorAll('.content-page').forEach(page => {
                page.classList.add('d-none');
            });
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.remove('d-none');
            }
        }
    }

    // 角色和讨论组初始化
    loadRoles();
    loadGroups();
    
    // 添加讨论组按钮点击事件 - 确保使用openAddGroupModal
    document.querySelector('[data-action="addGroup"]')?.addEventListener('click', openAddGroupModal);
    document.querySelector('[data-page="groups"] button')?.addEventListener('click', openAddGroupModal);
    

    // 工具配置显示控制
    document.getElementById('enableTools')?.addEventListener('change', function() {
        document.getElementById('toolsConfig').style.display = this.checked ? 'block' : 'none';
    });

    // 思考配置显示控制
    document.getElementById('enableThinking')?.addEventListener('change', function() {
        document.getElementById('thinkingConfig').style.display = this.checked ? 'block' : 'none';
    });
    
    // 为模态框中的插入模板按钮添加事件处理
    document.addEventListener('click', function(event) {
        if (event.target.matches('button[onclick="insertTemplatePrompt()"]')) {
            event.preventDefault();
            insertTemplatePrompt();
        }
    });
    
    // 设置人类角色切换事件
    setupHumanRoleToggle();
});

// API calls
async function fetchAPI(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`/v1/${endpoint}`, options);
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/static/login.html';
            throw new Error('Authentication failed');
        }
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

// Models management
async function loadModels() {
    try {
        // 获取模型配置
        const response = await fetchAPI('model_configs');
        models = response;
        // // console.log('Loaded models:', models); // 添加调试日志
        
        // 更新界面
        updateModelsList();
        
        // 更新所有配置步骤中的模型选择器
        updateAllModelSelects();
    } catch (error) {
        console.error('Failed to load models:', error);
        showError('Failed to load models');
    }
}

function updateModelsList() {
    const lang = localStorage.getItem('preferred_language') || 'en';
    const t = translations[lang];
    const modelsList = document.getElementById('modelsList');
    
    if (!modelsList) return; // 如果元素不存在则直接返回
    
    modelsList.innerHTML = models.map(model => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${model.name}</h5>
                    <div class="mb-3">
                        <span class="badge bg-primary">${model.type}</span>
                        <span class="badge bg-secondary">${model.provider}</span>
                        ${model.enable_tools ? 
                            '<span class="badge bg-success">Tools</span>' : ''}
                        ${model.enable_thinking ? 
                            '<span class="badge bg-info">Thinking</span>' : ''}
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editModel(${model.id})">
                            <i class="fas fa-edit"></i> ${t.edit}
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="saveAsModel(${model.id})">
                            <i class="fas fa-copy"></i> ${t.duplicate}
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteModel(${model.id})">
                            <i class="fas fa-trash"></i> ${t.delete}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateAllModelSelects() {
    // 更新配置步骤中的模型选择器
    const modelSelects = document.querySelectorAll('select[name$="].model_id"]');
    modelSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = getModelOptions();
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function getModelOptions() {
    if (!models || models.length === 0) {
        return '<option value="">No models available</option>';
    }
    
    return models.map(model => `
        <option value="${model.id}" data-type="${model.type}">
            ${model.name} (${model.type}) - ${model.provider}
        </option>
    `).join('');
}

async function editModel(modelId) {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    const lang = localStorage.getItem('preferred_language') || 'en';

    const form = document.getElementById('addModelForm');
    
    // 添加或更新隐藏的 model_id 字段
    let idInput = form.querySelector('input[name="model_id"]');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'model_id';
        form.appendChild(idInput);
    }
    idInput.value = modelId;
    
    // 填充基本字段
    form.name.value = model.name;
    form.type.value = model.type;
    form.provider.value = model.provider;
    form.api_key.value = model.api_key;
    form.api_url.value = model.api_url;
    form.model_name.value = model.model_name;
    form.temperature.value = model.temperature;
    form.top_p.value = model.top_p;
    form.max_tokens.value = model.max_tokens;
    form.presence_penalty.value = model.presence_penalty;
    form.frequency_penalty.value = model.frequency_penalty;
    
    // 填充工具配置
    const enableToolsCheckbox = document.getElementById('enableTools');
    enableToolsCheckbox.checked = model.enable_tools;
    const toolsConfig = document.getElementById('toolsConfig');
    toolsConfig.style.display = model.enable_tools ? 'block' : 'none';
    
    if (model.tools) {
        form.tools.value = JSON.stringify(model.tools, null, 2);
    } else {
        form.tools.value = '';
    }
    
    if (model.tool_choice) {
        form.tool_choice.value = JSON.stringify(model.tool_choice, null, 2);
    } else {
        form.tool_choice.value = '';
    }
    
    // 填充思考配置
    const enableThinkingCheckbox = document.getElementById('enableThinking');
    enableThinkingCheckbox.checked = model.enable_thinking;
    const thinkingConfig = document.getElementById('thinkingConfig');
    thinkingConfig.style.display = model.enable_thinking ? 'block' : 'none';
    form.thinking_budget_tokens.value = model.thinking_budget_tokens;
    
    // 填充自定义参数
    const customParametersContainer = document.getElementById('customParametersContainer');
    customParametersContainer.innerHTML = '';
    paramCounter = 0;
    
    if (model.custom_parameters) {
        Object.entries(model.custom_parameters).forEach(([name, value]) => {
            paramCounter++;
            const type = typeof value;
            const paramHtml = `
                <div class="custom-parameter mb-3" data-param="${paramCounter}">
                    <div class="row">
                        <div class="col-md-3">
                            <input type="text" class="form-control" 
                                   name="param_name_${paramCounter}" 
                                   value="${name}" required>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" name="param_type_${paramCounter}" 
                                    onchange="updateValueInput(${paramCounter})">
                                <option value="string" ${type === 'string' ? 'selected' : ''}>
                                    ${translations[lang].string}
                                </option>
                                <option value="number" ${type === 'number' ? 'selected' : ''}>
                                    ${translations[lang].number}
                                </option>
                                <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>
                                    ${translations[lang].boolean}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <div class="value-container">
                                ${type === 'boolean' 
                                    ? `<select class="form-select" name="param_value_${paramCounter}">
                                        <option value="true" ${value ? 'selected' : ''}>True</option>
                                        <option value="false" ${!value ? 'selected' : ''}>False</option>
                                       </select>`
                                    : `<input type="${type === 'number' ? 'number' : 'text'}" 
                                             class="form-control" 
                                             name="param_value_${paramCounter}" 
                                             value="${value}">`
                                }
                            </div>
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-danger" 
                                    onclick="removeParameter(${paramCounter})">
                                ${translations[lang].removeParameter}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            customParametersContainer.insertAdjacentHTML('beforeend', paramHtml);
        });
    }
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addModelModal'));
    modal.show();
}

async function saveModel() {
    try {
        const form = document.getElementById('addModelForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 处理工具配置
        if (data.tools) {
            try {
                data.tools = JSON.parse(data.tools);
            } catch (e) {
                data.tools = null;
            }
        }
        
        if (data.tool_choice) {
            try {
                data.tool_choice = JSON.parse(data.tool_choice);
            } catch (e) {
                data.tool_choice = null;
            }
        }
        
        // 处理布尔值
        data.enable_tools = formData.get('enable_tools') === 'on';
        data.enable_thinking = formData.get('enable_thinking') === 'on';
        
        // 处理自定义参数
        const customParameters = {};
        document.querySelectorAll('.custom-parameter').forEach(param => {
            const paramId = param.dataset.param;
            const name = formData.get(`param_name_${paramId}`);
            const type = formData.get(`param_type_${paramId}`);
            let value = formData.get(`param_value_${paramId}`);
            
            if (name) {
                switch(type) {
                    case 'number':
                        value = parseFloat(value);
                        break;
                    case 'boolean':
                        value = value === 'true';
                        break;
                }
                customParameters[name] = value;
            }
        });
        
        // 确保自定义参数是一个有效的对象
        data.custom_parameters = Object.keys(customParameters).length > 0 ? customParameters : {};
        
        // 获取 model_id
        const modelId = formData.get('model_id');
        
        if (modelId) {
            // 更新现有模型
            await fetchAPI(`models/${modelId}`, 'PUT', data);
        } else {
            // 创建新模型
            await fetchAPI('models', 'POST', data);
        }
        
        // 重新加载模型列表
        await loadModels();
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('addModelForm').closest('.modal'));
        modal.hide();
        
        // 显示成功消息
        const lang = localStorage.getItem('preferred_language') || 'en';
        const successMessage = lang === 'zh' ? '模型保存成功' : 'Model saved successfully';
        // alert(successMessage);
        
    } catch (error) {
        console.error('Failed to save model:', error);
        const lang = localStorage.getItem('preferred_language') || 'en';
        const errorMessage = lang === 'zh' ? '保存模型失败' : 'Failed to save model';
        showError(errorMessage);
    }
}

// Configurations management
async function loadConfigurations() {
    try {
        configurations = await fetchAPI('configurations');
        // console.log('Loaded configurations:', configurations);
        updateConfigurationsList();
    } catch (error) {
        console.error('Failed to load configurations:', error);
        showError('Failed to load configurations');
    }
}

function updateConfigurationsList() {
    const lang = localStorage.getItem('preferred_language') || 'en';
    const t = translations[lang];
    const configsList = document.getElementById('configurationsList');
    
    if (!configsList) return; // 如果元素不存在则直接返回
    
    configsList.innerHTML = configurations.map(config => `
        <div class="col-lg-6 mb-4">
            <div class="workflow-card">
                <div class="workflow-card-header d-flex justify-content-between align-items-center">
                    <h5 class="workflow-card-title">${config.name}</h5>
                    <div class="workflow-status-switch ${config.is_active ? 'active' : 'inactive'}">
                        <div class="form-check form-switch workflow-switch">
                            <input class="form-check-input" type="checkbox" 
                                   ${config.is_active ? 'checked' : ''}
                                   onchange="toggleConfiguration(${config.id}, this.checked)">
                        </div>
                        <span class="workflow-status-label">
                            ${config.is_active ? t.active : t.inactive}
                        </span>
                    </div>
                </div>
                <div class="workflow-card-body">
                    <div class="workflow-stats">
                        <div class="stat-item">
                            <div class="stat-value">${config.steps.length}</div>
                            <div class="stat-label">${t.steps}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${config.steps.filter(s => s.step_type === 'reasoning').length}</div>
                            <div class="stat-label">${t.reasoning}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${config.steps.filter(s => s.step_type === 'execution').length}</div>
                            <div class="stat-label">${t.execution}</div>
                        </div>
                    </div>
                    <div class="workflow-actions">
                        <button class="btn btn-outline-primary" onclick="editConfiguration(${config.id})">
                            <i class="fas fa-edit"></i> ${t.edit}
                        </button>
                        <button class="btn btn-outline-info" onclick="duplicateConfiguration(${config.id})">
                            <i class="fas fa-copy"></i> ${t.duplicate}
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteConfiguration(${config.id})">
                            <i class="fas fa-trash"></i> ${t.delete}
                        </button>
                        <button class="preview-btn" onclick="showWorkflowVisualization(${config.id})" 
                                title="${t.visualizeWorkflow}">
                            <i class="fas fa-project-diagram"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function editConfiguration(configId) {
    try {
        // console.log(`正在编辑配置 ID: ${configId}`);
        
        // 直接从 API 获取最新的配置数据
        const response = await fetch(`/v1/configurations/${configId}`);
        if (!response.ok) {
            throw new Error(`获取配置失败: ${response.status} ${response.statusText}`);
        }
        
        const config = await response.json();
        // console.log('从 API 获取的配置数据:', config);
        
        if (!config || !config.id) {
            showError('未找到配置或数据格式无效');
            return;
        }

        // 重置表单
        const form = document.getElementById('addConfigForm');
        form.reset();
        
        // 设置基本字段
        form.querySelector('[name="config_id"]').value = config.id;
        form.querySelector('[name="name"]').value = config.name;
        form.querySelector('[name="is_active"]').checked = config.is_active;
        
        // 清空现有步骤
        const stepsContainer = document.getElementById('configSteps');
        stepsContainer.innerHTML = '';
        stepCounter = 0;
        
        // 添加已有步骤
        if (config.steps && config.steps.length > 0) {
            // console.log(`配置包含 ${config.steps.length} 个步骤`);
            
            for (const step of config.steps) {
                // console.log('正在添加步骤:', step);
                addConfigurationStep();
                
                // 等待DOM更新
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const stepElement = stepsContainer.querySelector(`[data-step="${stepCounter}"]`);
                if (stepElement) {
                    const modelSelect = stepElement.querySelector('[name$="].model_id"]');
                    const stepTypeSelect = stepElement.querySelector('[name$="].step_type"]');
                    const stepOrderInput = stepElement.querySelector('[name$="].step_order"]');
                    const systemPromptInput = stepElement.querySelector('[name$="].system_prompt"]');
                    
                    if (modelSelect) {
                        modelSelect.value = step.model_id;
                        // console.log(`设置模型 ID: ${step.model_id}`);
                        
                        // 等待模型选择器更新
                        await new Promise(resolve => setTimeout(resolve, 50));
                        
                        // 更新步骤类型选项
                        updateStepTypeOptions(modelSelect);
                        
                        // 等待步骤类型选项更新
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    
                    if (stepTypeSelect) {
                        stepTypeSelect.value = step.step_type;
                        // console.log(`设置步骤类型: ${step.step_type}`);
                    }
                    
                    if (stepOrderInput) {
                        stepOrderInput.value = step.step_order;
                        // console.log(`设置步骤顺序: ${step.step_order}`);
                    }
                    
                    if (systemPromptInput) {
                        systemPromptInput.value = step.system_prompt || '';
                        // console.log(`设置系统提示: ${step.system_prompt || '(空)'}`); 
                    }
                } else {
                    console.error(`找不到步骤元素 ${stepCounter}`);
                }
            }
        } else {
            // console.log('没有步骤，添加默认步骤');
            // 如果没有步骤，添加一个默认步骤
            addConfigurationStep();
        }
        
        // 显示模态框
        const modalElement = document.getElementById('addConfigModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // 在显示模态框前设置一个事件监听器，在模态框显示后将焦点设置到模态框标题
        modalElement.addEventListener('shown.bs.modal', function() {
            // 将焦点设置到模态框标题或第一个输入字段
            const firstInput = modalElement.querySelector('input[name="name"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, { once: true }); // 只触发一次
        
        // 添加模态框关闭事件处理
        modalElement.addEventListener('hide.bs.modal', function() {
            // 在模态框关闭前移除焦点
            document.activeElement.blur();
            // 将焦点设置到文档主体
            document.body.focus();
        }, { once: true }); // 只触发一次
        
        modal.show();
        
    } catch (error) {
        console.error('编辑配置失败:', error);
        showError(`编辑配置失败: ${error.message}`);
    }
}

// 修改配置激活/停用功能
async function toggleConfiguration(configId, isActive) {
    try {
        const config = configurations.find(c => c.id === configId);
        if (!config) {
            showError('Configuration not found');
            return;
        }

        const updateData = {
            ...config,
            is_active: isActive
        };
        delete updateData.id;  // 移除id字段，因为它不需要更新

        await fetchAPI(`configurations/${configId}`, 'PUT', updateData);
        await loadConfigurations();  // 重新加载配置列表
    } catch (error) {
        console.error('Failed to toggle configuration:', error);
        showError('Failed to update configuration status');
    }
}

// 修改配置名称验证函数
function validateConfigurationName(name, currentId = null) {
    const nameInput = document.querySelector('#addConfigForm input[name="name"]');
    const existingConfig = configurations.find(c => c.name === name);
    
    // 如果找到同名配置，但是是当前正在编辑的配置，则允许保存
    if (existingConfig && existingConfig.id !== currentId) {
        nameInput.setCustomValidity('Configuration name already exists');
        return false;
    }
    
    nameInput.setCustomValidity('');
    return true;
}

// 修改保存配置函数
async function saveConfiguration() {
    try {
        const form = document.getElementById('addConfigForm');
        const formData = new FormData(form);
        const configId = formData.get('config_id');
        
        // 验证配置名称
        const configName = formData.get('name');
        if (!validateConfigurationName(configName, configId ? parseInt(configId) : null)) {
            showError('Configuration name already exists. Please choose a different name.');
            return;
        }
        
        // 收集步骤数据
        const steps = [];
        const stepElements = document.querySelectorAll('.configuration-step');
        
        stepElements.forEach(stepElement => {
            const stepNum = stepElement.dataset.step;
            const modelId = formData.get(`steps[${stepNum}].model_id`);
            const stepType = formData.get(`steps[${stepNum}].step_type`);
            const stepOrder = formData.get(`steps[${stepNum}].step_order`);
            const systemPrompt = formData.get(`steps[${stepNum}].system_prompt`);

            if (modelId && stepType && stepOrder) {
                steps.push({
                    model_id: parseInt(modelId),
                    step_type: stepType,
                    step_order: parseInt(stepOrder),
                    system_prompt: systemPrompt || ""
                });
            }
        });
        
        // 确保至少有一个步骤
        if (steps.length === 0) {
            showError('At least one step is required');
            return;
        }
        
        // 构建配置数据
        const configData = {
            name: configName,
            is_active: formData.get('is_active') === 'true',
            transfer_content: {},
            steps: steps
        };
        
        try {
            if (configId) {
                await fetchAPI(`configurations/${configId}`, 'PUT', configData);
                // console.log('Configuration updated successfully');
            } else {
                await fetchAPI('configurations', 'POST', configData);
                // console.log('Configuration created successfully');
            }
            
            await loadConfigurations();
            closeModal('addConfigModal');
            form.reset();
            document.getElementById('configSteps').innerHTML = '';
            stepCounter = 0;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            showError('Failed to save configuration: ' + error.message);
            throw error;
        }
    } catch (error) {
        console.error('Form processing error:', error);
        showError('Error processing form: ' + error.message);
    }
}

// 修改显示添加配置模态框的函数
function showAddConfigModal() {
    // 重置表单
    const form = document.getElementById('addConfigForm');
    form.reset();
    
    // 清除隐藏的 config_id
    const configIdInput = form.querySelector('[name="config_id"]');
    if (configIdInput) {
        configIdInput.value = '';
    }
    
    // 重置步骤计数器和步骤容器
    stepCounter = 0;
    const stepsContainer = document.getElementById('configSteps');
    if (stepsContainer) {
        stepsContainer.innerHTML = '';
    }
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addConfigModal'));
    modal.show();
    
    // 添加第一个步骤
    addConfigurationStep();
}

// 移除表单提交事件监听器，因为我们已经在 saveConfiguration 中处理了验证
const configForm = document.getElementById('addConfigForm');
if (configForm) {
    configForm.onsubmit = function(e) {
        e.preventDefault();
        saveConfiguration();
    };
}

// Utility functions
function getModelName(id) {
    const model = models.find(m => m.id === id);
    return model ? model.name : 'Unknown';
}

function showAddModelModal() {
    const form = document.getElementById('addModelForm');
    form.reset();
    
    // 清除 model_id
    const idInput = form.querySelector('input[name="model_id"]');
    if (idInput) {
        idInput.value = '';
    }
    
    // 清空自定义参数容器
    const customParametersContainer = document.getElementById('customParametersContainer');
    customParametersContainer.innerHTML = '';
    paramCounter = 0;
    
    // 重置工具配置显示
    document.getElementById('toolsConfig').style.display = 'none';
    
    // 重置思考配置显示
    document.getElementById('thinkingConfig').style.display = 'none';
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addModelModal'));
    modal.show();
}

function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}

function showError(message) {
    // You can implement a better error notification system
    alert(message);
}

function addConfigurationStep() {
    stepCounter++;
    const stepsContainer = document.getElementById('configSteps');
    const lang = localStorage.getItem('preferred_language') || 'en';
    const t = translations[lang];
    
    const stepHtml = `
        <div class="configuration-step" data-step="${stepCounter}">
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${t.step} ${stepCounter}</h5>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">${t.modelSelection}</label>
                                <select class="form-select" name="steps[${stepCounter}].model_id" required onchange="updateStepTypeOptions(this)">
                                    ${getModelOptions()}
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">${t.stepType}</label>
                                <select class="form-select" name="steps[${stepCounter}].step_type" required>
                                    <option value="reasoning">${t.reasoning}</option>
                                    <option value="execution">${t.execution}</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">${t.stepOrder}</label>
                                <input type="number" class="form-control" name="steps[${stepCounter}].step_order" value="${stepCounter}" required>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">${t.systemPrompt}</label>
                        <textarea class="form-control" name="steps[${stepCounter}].system_prompt" rows="3" placeholder="${t.systemPromptPlaceholder}"></textarea>
                    </div>
                    <button type="button" class="btn btn-danger" onclick="removeStep(${stepCounter})">${t.removeStep}</button>
                </div>
            </div>
        </div>
    `;
    
    stepsContainer.insertAdjacentHTML('beforeend', stepHtml);
    
    // 初始化新添加的步骤的模型选择器
    const newModelSelect = stepsContainer.querySelector(`[data-step="${stepCounter}"] select[name$="].model_id"]`);
    if (newModelSelect) {
        updateStepTypeOptions(newModelSelect);
    }
}

function removeStep(stepNum) {
    const step = document.querySelector(`[data-step="${stepNum}"]`);
    if (step) {
        step.remove();
    }
}

function updateStepTypeOptions(modelSelect) {
    const modelId = parseInt(modelSelect.value);
    const model = models.find(m => m.id === modelId);
    const stepTypeSelect = modelSelect.closest('.configuration-step')
        .querySelector('select[name$="].step_type"]');
    
    if (model && stepTypeSelect) {
        // 清空现有选项
        stepTypeSelect.innerHTML = '';
        
        // 添加适用的选项
        if (model.type === 'reasoning' || model.type === 'both') {
            stepTypeSelect.add(new Option('Reasoning', 'reasoning'));
        }
        if (model.type === 'execution' || model.type === 'both') {
            stepTypeSelect.add(new Option('Execution', 'execution'));
        }
        
        // 如果没有选项被添加（这种情况不应该发生），添加一个默认选项
        if (stepTypeSelect.options.length === 0) {
            stepTypeSelect.add(new Option('Select type', ''));
        }
    }
}

// 加载可用模型列表
async function loadAvailableModels() {
    const form = document.getElementById('addModelForm');
    const apiKey = form.querySelector('[name="api_key"]').value;
    const apiUrl = form.querySelector('[name="api_url"]').value;
    
    if (!apiKey || !apiUrl) {
        const select = document.getElementById('modelNameSelect');
        select.innerHTML = '<option value="">Please enter API credentials first</option>';
        return;
    }
    
    await handleAPICredentialsChange();
}

// 更新模型名称下拉列表
function updateModelNameSelect() {
    const select = document.getElementById('modelNameSelect');
    select.innerHTML = `
        <option value="">Select a model</option>
        ${availableModels.map(model => `
            <option value="${model.id}">${model.id}</option>
        `).join('')}
        <option value="custom">Custom...</option>
    `;
}

// 处理模型名称选择
function handleModelNameSelect(select) {
    const input = document.getElementById('modelNameInput');
    if (select.value === 'custom') {
        select.style.display = 'none';
        input.style.display = 'block';
        input.focus();
    } else if (select.value) {
        input.value = select.value;
    }
}

// 切换手动输入/下拉选择
function toggleModelNameInput() {
    const select = document.getElementById('modelNameSelect');
    const input = document.getElementById('modelNameInput');
    isManualModelInput = !isManualModelInput;
    
    if (isManualModelInput) {
        select.style.display = 'none';
        input.style.display = 'block';
        input.focus();
    } else {
        select.style.display = 'block';
        input.style.display = 'none';
        if (select.value === 'custom') {
            select.value = '';
        }
    }
}

// 添加新的函数来处理 API 凭证变更
async function handleAPICredentialsChange() {
    const form = document.getElementById('addModelForm');
    const apiKey = form.querySelector('[name="api_key"]').value;
    const apiUrl = form.querySelector('[name="api_url"]').value;
    const statusDiv = document.getElementById('modelLoadStatus');
    const modelSelect = document.getElementById('modelNameSelect');
    
    // 重置选择器
    modelSelect.innerHTML = '<option value="">Loading models...</option>';
    modelSelect.disabled = true;
    
    if (!apiKey || !apiUrl) {
        modelSelect.innerHTML = '<option value="">Please enter API credentials first</option>';
        statusDiv.textContent = '';
        return;
    }
    
    try {
        statusDiv.textContent = 'Loading available models...';
        const models = await fetchAvailableModels(apiUrl, apiKey);
        updateModelNameSelectWithModels(models);
        statusDiv.textContent = 'Models loaded successfully';
    } catch (error) {
        console.error('Failed to load models:', error);
        modelSelect.innerHTML = '<option value="">Failed to load models</option>';
        statusDiv.textContent = 'Error: ' + error.message;
        modelSelect.disabled = false;
    }
}

// 从 API 获取可用模型
async function fetchAvailableModels(apiUrl, apiKey) {
    const baseUrl = new URL(apiUrl);
    const modelsUrl = new URL('/v1/models', baseUrl.origin);
    
    const response = await fetch(modelsUrl.toString(), {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
}

// 使用获取到的模型更新下拉列表
function updateModelNameSelectWithModels(models) {
    const select = document.getElementById('modelNameSelect');
    select.innerHTML = `
        <option value="">Select a model</option>
        ${models.map(model => `
            <option value="${model.id}">${model.id}</option>
        `).join('')}
        <option value="custom">Custom...</option>
    `;
    select.disabled = false;
}

// 添加另存模型函数
async function saveAsModel(modelId) {
    // 获取当前语言
    const lang = localStorage.getItem('preferred_language') || 'en';
    
    const model = models.find(m => m.id === modelId);
    if (!model) {
        showError('Model not found');
        return;
    }

    // 复制模型数据
    const form = document.getElementById('addModelForm');
    form.reset();
    
    // 清除隐藏的 model_id 字段
    const idInput = form.querySelector('input[name="model_id"]');
    if (idInput) {
        idInput.value = '';
    }
    
    // 设置基本字段，但不包括 ID
    form.name.value = model.name + ' (Copy)';  // 添加 (Copy) 后缀
    form.type.value = model.type;
    form.provider.value = model.provider;
    form.api_key.value = model.api_key;
    form.api_url.value = model.api_url;
    
    // 设置模型名称
    const modelSelect = document.getElementById('modelNameSelect');
    const modelInput = document.getElementById('modelNameInput');
    modelInput.value = model.model_name || '';
    
    // 如果有 API 凭证，尝试加载模型列表
    if (model.api_key && model.api_url) {
        await handleAPICredentialsChange();
    }
    
    // 设置其他参数
    form.temperature.value = model.temperature;
    form.top_p.value = model.top_p;
    form.max_tokens.value = model.max_tokens;
    form.presence_penalty.value = model.presence_penalty;
    form.frequency_penalty.value = model.frequency_penalty;

    // 设置工具配置
    const enableToolsCheckbox = document.getElementById('enableTools');
    enableToolsCheckbox.checked = model.enable_tools;
    const toolsConfig = document.getElementById('toolsConfig');
    toolsConfig.style.display = model.enable_tools ? 'block' : 'none';
    
    if (model.tools) {
        form.tools.value = JSON.stringify(model.tools, null, 2);
    } else {
        form.tools.value = '';
    }
    
    if (model.tool_choice) {
        form.tool_choice.value = JSON.stringify(model.tool_choice, null, 2);
    } else {
        form.tool_choice.value = '';
    }
    
    // 设置思考配置
    const enableThinkingCheckbox = document.getElementById('enableThinking');
    enableThinkingCheckbox.checked = model.enable_thinking;
    const thinkingConfig = document.getElementById('thinkingConfig');
    thinkingConfig.style.display = model.enable_thinking ? 'block' : 'none';
    form.thinking_budget_tokens.value = model.thinking_budget_tokens;
    
    // 复制自定义参数
    const customParametersContainer = document.getElementById('customParametersContainer');
    customParametersContainer.innerHTML = '';
    paramCounter = 0;
    
    if (model.custom_parameters) {
        Object.entries(model.custom_parameters).forEach(([name, value]) => {
            paramCounter++;
            const type = typeof value;
            const paramHtml = `
                <div class="custom-parameter mb-3" data-param="${paramCounter}">
                    <div class="row">
                        <div class="col-md-3">
                            <input type="text" class="form-control" 
                                   name="param_name_${paramCounter}" 
                                   value="${name}" required>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" name="param_type_${paramCounter}" 
                                    onchange="updateValueInput(${paramCounter})">
                                <option value="string" ${type === 'string' ? 'selected' : ''}>
                                    ${translations[lang].string}
                                </option>
                                <option value="number" ${type === 'number' ? 'selected' : ''}>
                                    ${translations[lang].number}
                                </option>
                                <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>
                                    ${translations[lang].boolean}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <div class="value-container">
                                ${type === 'boolean' 
                                    ? `<select class="form-select" name="param_value_${paramCounter}">
                                        <option value="true" ${value ? 'selected' : ''}>True</option>
                                        <option value="false" ${!value ? 'selected' : ''}>False</option>
                                       </select>`
                                    : `<input type="${type === 'number' ? 'number' : 'text'}" 
                                             class="form-control" 
                                             name="param_value_${paramCounter}" 
                                             value="${value}">`
                                }
                            </div>
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-danger" 
                                    onclick="removeParameter(${paramCounter})">
                                ${translations[lang].removeParameter}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            customParametersContainer.insertAdjacentHTML('beforeend', paramHtml);
        });
    }

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addModelModal'));
    modal.show();
}

// Sidebar navigation
document.querySelectorAll('.sidebar-menu li').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        
        // 如果是chatllm页面，直接导航
        if (page === 'chatllm') {
            window.location.href = '/static/chatllm.html';
            return;
        }
        
        // Remove active class from all items
        document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');
        
        // Show corresponding page
        const pageId = page + '-page';
        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.add('d-none');
        });
        document.getElementById(pageId).classList.remove('d-none');
    });
});

function updateWorkflowVisualization(config) {
    const container = document.getElementById('workflowCircle');
    const steps = config.steps;
    const centerX = 250;
    const centerY = 250;
    const radius = 180;

    // Clear previous visualization
    container.innerHTML = '';

    // Add steps
    steps.forEach((step, index) => {
        const angle = (index / steps.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const stepEl = document.createElement('div');
        stepEl.className = `workflow-step ${step.step_type}`;
        stepEl.style.left = `${x - 70}px`;
        stepEl.style.top = `${y - 70}px`;
        
        // 获取关联的模型信息
        const model = models.find(m => m.id === step.model_id);
        const modelName = model ? model.name : 'Unknown Model';
        
        stepEl.innerHTML = `
            <div class="step-content">
                <div class="step-number">${index + 1}</div>
                <div class="step-type">${step.step_type}</div>
                <div class="step-model">${modelName}</div>
            </div>
        `;

        // 添加悬停提示
        stepEl.title = `Step ${index + 1}\nType: ${step.step_type}\nModel: ${modelName}`;

        container.appendChild(stepEl);

        // Add connector if not last step
        if (index < steps.length - 1) {
            const nextAngle = ((index + 1) / steps.length) * 2 * Math.PI - Math.PI / 2;
            const nextX = centerX + radius * Math.cos(nextAngle);
            const nextY = centerY + radius * Math.sin(nextAngle);

            const connector = document.createElement('div');
            connector.className = 'workflow-connector';
            const length = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));
            const angle = Math.atan2(nextY - y, nextX - x);

            connector.style.width = `${length}px`;
            connector.style.left = `${x}px`;
            connector.style.top = `${y}px`;
            connector.style.transform = `rotate(${angle}rad)`;

            container.appendChild(connector);
        }
    });
}

function showWorkflowVisualization(configId) {
    const config = configurations.find(c => c.id === configId);
    if (!config) {
        showError('Configuration not found');
        return;
    }

    // 清空并更新可视化
    const container = document.getElementById('workflowCircle');
    container.innerHTML = '';
    updateWorkflowVisualization(config);

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('workflowVisualizationModal'));
    modal.show();
}

// Language change
function changeLanguage(lang) {
    // 保存语言偏好
    localStorage.setItem('preferred_language', lang);
    
    // 同步两个语言选择器的值
    document.getElementById('languageSelect').value = lang;
    document.getElementById('languageSelectPopup').value = lang;
    
    const t = translations[lang];
    
    // 更新页面文本
    function updateText(element) {
        const translateKey = element.getAttribute('data-translate');
        if (translateKey && t[translateKey]) {
            if (element.tagName.toLowerCase() === 'input' || 
                element.tagName.toLowerCase() === 'textarea') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = t[translateKey];
                } else {
                    element.value = t[translateKey];
                }
            } else {
                element.textContent = t[translateKey];
            }
        }
        
        // 递归处理子元素
        Array.from(element.children).forEach(updateText);
    }
    
    // 从根元素开始更新
    updateText(document.body);
    
    // 更新动态生成的内容
    updateConfigurationsList();
    updateModelsList();
}

// Theme toggle
function toggleTheme() {
    const body = document.body;
    const darkModeControl = document.querySelector('.dark-mode-control');
    const darkModeText = darkModeControl.querySelector('[data-translate="darkMode"]');
    
    body.classList.toggle('dark-theme');
    darkModeControl.classList.toggle('dark');
    
    // 更新文字
    const lang = localStorage.getItem('preferred_language') || 'en';
    if (body.classList.contains('dark-theme')) {
        darkModeText.textContent = lang === 'zh' ? '日间模式' : 'Light Mode';
    } else {
        darkModeText.textContent = lang === 'zh' ? '夜间模式' : 'Dark Mode';
    }
    
    // 保存主题偏好
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('dark_theme', isDark);
}

// 复制工作流配置
async function duplicateConfiguration(configId) {
    try {
        const config = configurations.find(c => c.id === configId);
        if (!config) {
            showError('Configuration not found');
            return;
        }

        // 创建配置的副本
        const duplicatedConfig = {
            name: `${config.name} (Copy)`,
            is_active: false, // 默认设置为未激活
            transfer_content: config.transfer_content || {},
            steps: config.steps.map(step => ({
                model_id: step.model_id,
                step_type: step.step_type,
                step_order: step.step_order,
                system_prompt: step.system_prompt || ""
            }))
        };

        // 发送创建请求
        await fetchAPI('configurations', 'POST', duplicatedConfig);
        
        // 重新加载配置列表
        await loadConfigurations();
        
        // 显示成功消息
        const lang = localStorage.getItem('preferred_language') || 'en';
        const successMessage = lang === 'zh' ? 
            '接力链复制成功' : 
            'Relay chain duplicated successfully';
        alert(successMessage);
        
    } catch (error) {
        console.error('Failed to duplicate configuration:', error);
        showError('Failed to duplicate configuration: ' + error.message);
    }
}

// Delete model
async function deleteModel(modelId) {
    try {
        // 获取当前语言
        const lang = localStorage.getItem('preferred_language') || 'en';
        
        // 确认删除提示
        const confirmMessage = lang === 'zh' ? 
            '确定要删除这个模型吗？此操作不可恢复。' : 
            'Are you sure you want to delete this model? This action cannot be undone.';
            
        if (!confirm(confirmMessage)) {
            return;
        }

        // 检查模型是否在工作流中使用
        const isModelInUse = configurations.some(config => 
            config.steps.some(step => step.model_id === modelId)
        );

        if (isModelInUse) {
            const errorMessage = lang === 'zh' ?
                '无法删除：该模型正在被一个或多个工作流使用。' :
                'Cannot delete: This model is being used in one or more workflows.';
            showError(errorMessage);
            return;
        }

        // 发送删除请求
        await fetchAPI(`models/${modelId}`, 'DELETE');
        
        // 重新加载模型列表
        await loadModels();
        
        // 显示成功消息
        const successMessage = lang === 'zh' ? 
            '模型删除成功' : 
            'Model deleted successfully';
        alert(successMessage);
        
    } catch (error) {
        console.error('Failed to delete model:', error);
        const errorMessage = lang === 'zh' ?
            '删除模型失败：' + error.message :
            'Failed to delete model: ' + error.message;
        showError(errorMessage);
    }
}

// Delete configuration
async function deleteConfiguration(configId) {
    try {
        // 获取当前语言
        const lang = localStorage.getItem('preferred_language') || 'en';
        
        // 确认删除提示
        const confirmMessage = lang === 'zh' ? 
            '确定要删除这个接力链吗？此操作不可恢复。' : 
            'Are you sure you want to delete this relay chain? This action cannot be undone.';
            
        if (!confirm(confirmMessage)) {
            return;
        }

        // 发送删除请求
        await fetchAPI(`configurations/${configId}`, 'DELETE');
        
        // 重新加载配置列表
        await loadConfigurations();
        
        // 显示成功消息
        const successMessage = lang === 'zh' ? 
            '接力链删除成功' : 
            'Relay chain deleted successfully';
        alert(successMessage);
        
    } catch (error) {
        console.error('Failed to delete configuration:', error);
        const errorMessage = lang === 'zh' ?
            '删除接力链失败：' + error.message :
            'Failed to delete relay chain: ' + error.message;
        showError(errorMessage);
    }
}

// API Keys management
async function loadApiKeys() {
    try {
        const response = await fetchAPI('api_keys');
        apiKeys = response;
        updateApiKeysList();
    } catch (error) {
        console.error('Failed to load API keys:', error);
        showError('Failed to load API keys');
    }
}

function updateApiKeysList() {
    const apiKeysList = document.querySelector('.api-keys-list');
    const lang = localStorage.getItem('preferred_language') || 'en';
    const t = translations[lang];
    
    if (!apiKeysList) return; // 如果元素不存在则直接返回
    
    if (!apiKeys || apiKeys.length === 0) {
        apiKeysList.innerHTML = `
            <div class="alert alert-info">
                ${lang === 'zh' ? '暂无 API 密钥' : 'No API keys available'}
            </div>
        `;
        return;
    }
    
    apiKeysList.innerHTML = apiKeys.map(key => `
        <div class="api-key-item">
            <div class="api-key-info">
                <div class="api-key-value">
                    ${key.api_key.substring(0, 16)}...
                </div>
                <div class="api-key-description">${key.description || ''}</div>
            </div>
            <div class="api-key-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="copyApiKey('${key.api_key}')">
                    <i class="fas fa-copy"></i> ${t.copy}
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteApiKey(${key.id})">
                    <i class="fas fa-trash"></i> ${t.delete}
                </button>
            </div>
        </div>
    `).join('');
}

function showAddApiKeyModal() {
    const modal = new bootstrap.Modal(document.getElementById('addApiKeyModal'));
    modal.show();
}

// 生成 API 密钥
function generateApiKey() {
    const randomString = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    const apiKey = `sk-api-${randomString}`;
    
    // 获取当前活动的模态框中的 API 密钥输入框
    const activeModal = document.querySelector('.modal.show');
    if (activeModal) {
        const apiKeyInput = activeModal.querySelector('input[name="api_key"]');
        if (apiKeyInput) {
            apiKeyInput.value = apiKey;
        }
    }
    
    const lang = localStorage.getItem('preferred_language') || 'en';
    const message = translations[lang].apiKeyGenerated;
    showSuccess(message);
}

// 验证 API 密钥格式
function validateApiKey(apiKey) {
    return apiKey.startsWith('sk-api-') && apiKey.length >= 16;
}

// 修改保存 API 密钥的函数
async function saveApiKey() {
    const form = document.getElementById('addApiKeyForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // 验证 API 密钥格式
    if (!validateApiKey(data.api_key)) {
        const lang = localStorage.getItem('preferred_language') || 'en';
        showError(translations[lang].apiKeyInvalid);
        return;
    }
    
    try {
        await fetchAPI('api_keys', 'POST', data);
        await loadApiKeys();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addApiKeyModal'));
        modal.hide();
        form.reset();
        
        const lang = localStorage.getItem('preferred_language') || 'en';
        const successMessage = lang === 'zh' ? 'API 密钥添加成功' : 'API key added successfully';
        showSuccess(successMessage);
    } catch (error) {
        console.error('Failed to save API key:', error);
        showError('Failed to save API key');
    }
}

// 添加成功提示函数
function showSuccess(message) {
    // 使用showToast函数显示成功消息
    showToast('success', message);
}

async function deleteApiKey(keyId) {
    const lang = localStorage.getItem('preferred_language') || 'en';
    const confirmMessage = lang === 'zh' ? 
        '确定要删除这个 API 密钥吗？此操作不可恢复。' : 
        'Are you sure you want to delete this API key? This action cannot be undone.';
        
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        await fetchAPI(`api_keys/${keyId}`, 'DELETE');
        await loadApiKeys();
        
        const successMessage = lang === 'zh' ? 'API 密钥删除成功' : 'API key deleted successfully';
        alert(successMessage);
    } catch (error) {
        console.error('Failed to delete API key:', error);
        showError('Failed to delete API key');
    }
}

// 复制 API 密钥到剪贴板
async function copyApiKey(apiKey) {
    try {
        await navigator.clipboard.writeText(apiKey);
        const lang = localStorage.getItem('preferred_language') || 'en';
        const message = lang === 'zh' ? 'API 密钥已复制' : 'API key copied';
        showSuccess(message);
    } catch (err) {
        console.error('Failed to copy:', err);
        showError('Failed to copy API key');
    }
}

// Settings navigation
document.addEventListener('DOMContentLoaded', function() {
    const settingsNavItems = document.querySelectorAll('.settings-nav-item');
    settingsNavItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items and sections
            settingsNavItems.forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked item and corresponding section
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section') + '-section';
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Load API keys when settings page is loaded
    loadApiKeys();
});

// 检查登录状态
function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/static/login.html';
        return false;
    }
    return true;
}

// 更新凭据
async function updateCredentials() {
    if (!checkAuth()) return;
    
    const form = document.getElementById('credentialsForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/v1/update-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update credentials');
        }
        
        showSuccess('Credentials updated successfully');
        form.reset();
    } catch (error) {
        showError('Failed to update credentials');
    }
}

// 登出
async function logout() {
    const lang = localStorage.getItem('preferred_language') || 'en';
    const confirmMessage = translations[lang].logoutConfirm;
    
    if (confirm(confirmMessage)) {
        try {
            // 调用登出 API
            await fetchAPI('auth/logout', 'POST');
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // 无论 API 调用是否成功，都清除本地存储并跳转
            localStorage.removeItem('access_token');
            window.location.href = '/static/login.html';
        }
    }
}

// 添加自定义参数相关函数
function addCustomParameter() {
    const lang = localStorage.getItem('preferred_language') || 'en';
    paramCounter++;
    const container = document.getElementById('customParametersContainer');
    const paramHtml = `
        <div class="custom-parameter mb-3" data-param="${paramCounter}">
            <div class="row">
                <div class="col-md-3">
                    <input type="text" class="form-control" 
                           name="param_name_${paramCounter}" 
                           placeholder="${translations[lang].parameterName}" required>
                </div>
                <div class="col-md-3">
                    <select class="form-select" name="param_type_${paramCounter}" 
                            onchange="updateValueInput(${paramCounter})">
                        <option value="string">${translations[lang].string}</option>
                        <option value="number">${translations[lang].number}</option>
                        <option value="boolean">${translations[lang].boolean}</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <div class="value-container">
                        <input type="text" class="form-control" 
                               name="param_value_${paramCounter}" 
                               placeholder="${translations[lang].parameterValue}" required>
                    </div>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-danger" 
                            onclick="removeParameter(${paramCounter})">
                        ${translations[lang].removeParameter}
                    </button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', paramHtml);
}

function removeParameter(paramId) {
    const paramElement = document.querySelector(`.custom-parameter[data-param="${paramId}"]`);
    if (paramElement) {
        paramElement.remove();
    }
}

function updateValueInput(paramId) {
    const typeSelect = document.querySelector(`[name="param_type_${paramId}"]`);
    const valueContainer = typeSelect.closest('.row').querySelector('.value-container');
    const currentValue = valueContainer.querySelector('input, select').value;
    const lang = localStorage.getItem('preferred_language') || 'en';
    const t = translations[lang];
    
    let newInput;
    switch(typeSelect.value) {
        case 'boolean':
            newInput = `<select class="form-select" name="param_value_${paramId}">
                <option value="true">True</option>
                <option value="false">False</option>
            </select>`;
            break;
        case 'number':
            newInput = `<input type="number" class="form-control" name="param_value_${paramId}" 
                              value="${currentValue}" step="any" 
                              placeholder="${t.parameterValue}">`;
            break;
        default:
            newInput = `<input type="text" class="form-control" name="param_value_${paramId}" 
                              value="${currentValue}" 
                              placeholder="${t.parameterValue}">`;
    }
    valueContainer.innerHTML = newInput;
}

// 角色管理功能 - 修改卡片布局，将按钮移到卡片底部
function loadRoles() {
    // 使用现有的fetchAPI函数，保持认证一致
    fetchAPI('roles', 'GET')  // 这会被转换为/v1/roles
        .then(data => {
            // 添加数据格式检查
            if (!Array.isArray(data)) {
                // console.log('角色数据格式不正确:', data);
                data = []; // 提供默认空数组
            }
            
            // console.log('获取到的角色数据:', data);
            
            const rolesContainer = document.getElementById('rolesList');
            if (!rolesContainer) {
                // console.log('未找到rolesList元素，可能在当前页面不存在');
                return; // 提前返回，避免null引用
            }
            
            rolesContainer.innerHTML = '';
            
            if (data.length === 0) {
                // 显示空提示
                rolesContainer.innerHTML = '<div class="col-12 text-center py-4">暂无角色数据</div>';
                return;
            }
            
            const lang = getCurrentLanguage();
            const t = translations[lang];
            
            // 使用卡片布局显示角色，修改布局结构确保按钮位于底部
            const rolesHtml = data.map(role => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="flex-grow-1">
                                <h5 class="card-title">${role.name}</h5>
                                <p class="card-text text-muted small">${role.description || t.noDescription}</p>
                                <div class="mb-3">
                                    <span class="badge bg-primary">${role.personality || t.noPersonality}</span>
                                    ${role.skills && role.skills.length > 0 ? 
                                        role.skills.map(skill => `<span class="badge bg-info me-1">${skill}</span>`).join('') : 
                                        `<span class="badge bg-secondary">${t.noSkills}</span>`}
                                </div>
                                <div class="mb-2 text-muted small">
                                    <i class="fas fa-robot me-1"></i> ${role.model_name || t.defaultModel}
                                </div>
                            </div>
                            <div class="mt-auto pt-3">
                                <div class="btn-group w-100">
                                    <button class="btn btn-sm btn-outline-primary" onclick="editRole(${role.id})">
                                        <i class="fas fa-edit"></i> ${t.edit}
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRole(${role.id})">
                                        <i class="fas fa-trash"></i> ${t.delete}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            rolesContainer.innerHTML = rolesHtml;
        })
        .catch(error => {
            console.error('获取角色失败:', error);
            // 显示错误状态
            const rolesContainer = document.getElementById('rolesList');
            if (rolesContainer) {
                rolesContainer.innerHTML = `
                    <div class="col-12 text-center text-danger py-4">
                        获取角色数据失败，请稍后重试
                    </div>
                `;
            }
        });
}

function loadModelsForRoles() {
    return fetchAPI('model_configs', 'GET')  // 使用model_configs端点
        .then(data => {
            // 添加数据格式检查
            if (!Array.isArray(data)) {
                // console.log('模型配置数据格式不正确:', data);
                data = []; // 提供默认空数组
            }
            
            // console.log('获取到的模型配置数据:', data);
            
            const select = document.querySelector('#addRoleForm select[name="model_id"]');
            if (!select) {
                // console.log('未找到model_id选择器，可能在当前页面不存在');
                return data; // 提前返回，避免null引用
            }
            
            select.innerHTML = '<option value="" disabled selected>请选择模型</option>';
            
            // 填充下拉列表
            data.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;  // 使用模型配置ID
                option.textContent = model.name;  // 使用模型配置名称
                select.appendChild(option);
            });
            
            return data;
        })
        .catch(error => {
            console.error('获取模型配置失败:', error);
            
            // 添加一个默认选项
            const select = document.querySelector('#addRoleForm select[name="model_id"]');
            if (select) {
                select.innerHTML = '<option value="" disabled selected>无法获取模型配置</option>';
            }
            
            return [];
        });
}

function openAddRoleModal() {
    // 重置表单
    const form = document.getElementById('addRoleForm');
    form.reset();
    
    // 清除之前可能添加的ID字段
    const oldIdField = form.querySelector('input[name="id"]');
    if (oldIdField) oldIdField.remove();
    
    // 重置人类角色相关UI状态
    const isHumanCheckbox = document.getElementById('isHuman');
    if (isHumanCheckbox) {
        isHumanCheckbox.checked = false;
        
        // 触发一次change事件，确保UI状态正确
        const event = new Event('change');
        isHumanCheckbox.dispatchEvent(event);
    }
    
    // 加载模型列表
    loadModelsForRoleModal();
    
    // 添加模态框标题
    const modalTitle = document.querySelector('#addRoleModal .modal-title');
    modalTitle.textContent = getCurrentTranslation('addNewRole');
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addRoleModal'));
    modal.show();
}

function saveRole() {
    const form = document.getElementById('addRoleForm');
    const formData = new FormData(form);
    const roleData = {};
    
    // 转换表单数据为JSON对象
    formData.forEach((value, key) => {
        if (key === 'is_human') {
            // 复选框需要特殊处理
            roleData[key] = true;
        } else if (key === 'skills') {
            // 技能列表需要转换为数组
            roleData[key] = value ? value.split(',').map(s => s.trim()) : [];
        } else if (key === 'parameters') {
            // 参数需要解析为JSON对象
            try {
                roleData[key] = value ? JSON.parse(value) : {};
            } catch (e) {
                console.error('解析参数失败:', e);
                roleData[key] = {};
            }
        } else {
            roleData[key] = value;
        }
    });
    
    // 处理人类角色的特殊情况
    const isHuman = formData.has('is_human');
    
    // 如果没有勾选人类角色，确保移除相关字段
    if (!isHuman) {
        roleData.is_human = false;
        roleData.host_role_id = null;
    } else {
        // 人类角色不需要model_id，但是后端仍需要一个默认值
        // 如果用户未选择模型，设置一个占位符值
        if (!roleData.model_id) {
            // console.log('人类角色，设置默认model_id为1');
            roleData.model_id = 1; // 后端会处理此值
        }
    }
    
    // 获取角色ID(如果存在)
    const roleId = form.querySelector('input[name="id"]')?.value;
    
    // 确定是创建还是更新
    const method = roleId ? 'PUT' : 'POST';
    const endpoint = roleId ? `roles/${roleId}` : 'roles';
    
    // 发送请求
    fetchAPI(endpoint, method, roleData)
        .then(response => {
            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('addRoleModal')).hide();
            
            // 重新加载角色
            loadRoles();
            
            showSuccess(roleId ? '角色更新成功' : '角色添加成功', 'success');
        })
        .catch(error => {
            console.error(roleId ? '更新角色失败:' : '添加角色失败:', error);
            showSuccess(roleId ? '角色更新失败' : '角色添加失败', 'error');
        });
}

function editRole(roleId) {
    // 获取角色详情
    fetchAPI(`roles/${roleId}`, 'GET')
        .then(role => {
            // 填充表单
            const form = document.getElementById('addRoleForm');
            
            // 重置表单，确保清除所有旧值
            form.reset();
            
            // 移除可能存在的旧ID字段
            const existingIdField = form.querySelector('input[name="id"]');
            if (existingIdField) {
                existingIdField.remove();
            }
            
            // 填充表单字段
            form.elements['name'].value = role.name;
            form.elements['description'].value = role.description || '';
            form.elements['personality'].value = role.personality || '';
            form.elements['skills'].value = (role.skills || []).join(', ');
            form.elements['system_prompt'].value = role.system_prompt || '';
            
            // 加载模型选项
            loadModelsForRoles().then(() => {
                form.elements['model_id'].value = role.model_id;
            });
            
            form.elements['parameters'].value = JSON.stringify(role.parameters || {}, null, 2);
            
            // 添加角色ID到表单
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'id';
            hiddenInput.value = roleId;
            form.appendChild(hiddenInput);
            
            // 设置人类角色相关字段
            const isHumanCheckbox = document.getElementById('isHuman');
            if (isHumanCheckbox) {
                isHumanCheckbox.checked = role.is_human || false;
                
                // 触发change事件以更新UI
                const event = new Event('change');
                isHumanCheckbox.dispatchEvent(event);
                
                // 如果是人类角色并有寄生目标，设置寄生角色
                if (role.is_human && role.host_role_id) {
                    // 需要先加载寄生角色列表，然后设置选中值
                    loadHostRoles().then(() => {
                        const hostRoleSelect = form.querySelector('select[name="host_role_id"]');
                        if (hostRoleSelect) {
                            hostRoleSelect.value = role.host_role_id;
                        }
                    });
                }
            }
            
            // 显示模态框
            new bootstrap.Modal(document.getElementById('addRoleModal')).show();
        })
        .catch(error => {
            console.error('获取角色详情失败:', error);
            showToast('获取角色详情失败', 'error');
        });
}

function deleteRole(roleId) {
    if (confirm('确定要删除这个角色吗？')) {
        fetchAPI(`roles/${roleId}`, 'DELETE')
        .then(response => {
                loadRoles();
                showToast('success', '角色删除成功');
        })
        .catch(error => {
            console.error('删除角色失败:', error);
            showToast('error', '删除角色失败');
        });
    }
}

// 讨论组管理功能 - 移除主题和开始讨论按钮
function loadGroups() {
    fetchAPI('discussion_groups', 'GET')  // 这会被转换为/v1/discussion_groups
        .then(data => {
            // 添加数据格式检查
            if (!Array.isArray(data)) {
                // console.log('讨论组数据格式不正确:', data);
                data = []; // 提供默认空数组
            }
            
            const groupsContainer = document.getElementById('groupsList');
            if (!groupsContainer) {
                // console.log('未找到groupsList元素，可能在当前页面不存在');
                return; // 提前返回，避免null引用
            }
            
            groupsContainer.innerHTML = '';
            
            if (data.length === 0) {
                // 显示空提示
                groupsContainer.innerHTML = '<div class="col-12 text-center py-4">暂无讨论组数据</div>';
                return;
            }
            
            const lang = getCurrentLanguage();
            const t = translations[lang];
            
            // 使用卡片布局显示讨论组
            const groupsHtml = data.map(group => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="flex-grow-1">
                                <h5 class="card-title">${group.name}</h5>
                                <div class="mb-3">
                                    <span class="badge bg-primary">${getModeDisplayName(group.mode || 'discussion')}</span>
                                    <span class="badge bg-info">
                                        <i class="fas fa-users me-1"></i> ${Array.isArray(group.roles) ? group.roles.length : 0} ${t.roleCount}
                                    </span>
                                    <span class="badge bg-secondary">
                                        <i class="fas fa-sync-alt me-1"></i> ${group.max_rounds || 3} ${t.rounds}
                                    </span>
                                </div>
                            </div>
                            <div class="mt-auto pt-3">
                                <div class="btn-group w-100">
                                    <button class="btn btn-sm btn-outline-primary" onclick="editGroup(${group.id})">
                                        <i class="fas fa-edit"></i> ${t.edit}
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteGroup(${group.id})">
                                        <i class="fas fa-trash"></i> ${t.delete}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            groupsContainer.innerHTML = groupsHtml;
        })
        .catch(error => {
            console.error('获取讨论组失败:', error);
            // 显示错误状态
            const groupsContainer = document.getElementById('groupsList');
            if (groupsContainer) {
                groupsContainer.innerHTML = `
                    <div class="col-12 text-center text-danger py-4">
                        获取讨论组数据失败，请稍后重试
                    </div>
                `;
            }
        });
}

function loadRolesForGroups() {
    return fetchAPI('roles')
    .then(roles => {
        const container = document.getElementById('roleCheckboxes');
        if (!container) {
            // console.log('未找到roleCheckboxes元素，可能在当前页面不存在');
            return data; // 提前返回，避免null引用
        }
        
        container.innerHTML = '';
        
        roles.forEach(role => {
            const div = document.createElement('div');
            div.className = 'form-check me-3 mb-2';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input';
            checkbox.name = 'role_ids';
            checkbox.value = role.id;
            checkbox.id = `role_${role.id}`;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `role_${role.id}`;
            label.textContent = role.name;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
        
        return roles;
    })
    .catch(error => {
        console.error('获取角色失败:', error);
        const container = document.getElementById('roleCheckboxes');
        if (container) {
            container.innerHTML = '<div class="alert alert-danger">获取角色失败，请稍后重试</div>';
        }
        return [];
    });
}

function getModeDisplayName(mode) {
    const lang = getCurrentLanguage();
    const t = translations[lang];
    
    const modeKeys = {
        'discussion': 'discussion',
        'brainstorming': 'brainstorming',
        'debate': 'debate',
        'role_playing': 'rolePlaying',
        'swot_analysis': 'swotAnalysis',
        'six_thinking_hats': 'sixThinkingHats'
    };
    
    return t[modeKeys[mode]] || mode;
}

// 移除重复的函数，统一使用openAddGroupModal
function openAddGroupModal() {
    // console.log("正在打开添加讨论组模态框");
    
    const form = document.getElementById('addGroupForm');
    form.reset();
    
    // 一定要删除ID字段，这是关键步骤
    const hiddenInput = form.querySelector('input[name="id"]');
    if (hiddenInput) {
        // // console.log("发现并移除了隐藏的ID字段: " + hiddenInput.value);
        hiddenInput.remove();
    }
    
    // 加载角色和模型
    loadRolesForGroupModal();
    loadModelsForGroupModal();
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addGroupModal'));
    modal.show();
}

// 修改saveGroup函数，确保新增时不会携带ID
function saveGroup() {
    const form = document.getElementById('addGroupForm');
    
    const formData = new FormData(form);
    
    // 获取选中的角色ID
    const roleIds = [];
    const checkboxes = document.querySelectorAll('#roleCheckboxes input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        roleIds.push(parseInt(checkbox.value));
    });
    
    const groupData = {
        name: formData.get('name'),
        description: formData.get('description'),
        mode: formData.get('mode'),
        max_rounds: parseInt(formData.get('max_rounds')) || 3,
        summary_model_id: formData.get('summary_model_id') ? parseInt(formData.get('summary_model_id')) : null,
        summary_prompt: formData.get('summary_prompt'),
        role_ids: roleIds,
        custom_speaking_order: getCustomSpeakingOrder()
    };
    
    // 确保max_rounds在有效范围内
    if (groupData.max_rounds < 1) groupData.max_rounds = 1;
    if (groupData.max_rounds > 20) groupData.max_rounds = 20;
    
    // 获取组ID（如果是编辑）
    const hiddenInput = form.querySelector('input[name="id"]');
    const groupId = hiddenInput ? hiddenInput.value : null;
    
    // 打印完整的请求信息，帮助调试
    // // console.log({
    //    action: groupId ? '更新' : '创建',
    //    url: groupId ? `discussion_groups/${groupId}` : 'discussion_groups',
    //    method: groupId ? 'PUT' : 'POST',
    //    groupId: groupId,
    //    hiddenInput: hiddenInput,
    //    data: data
    // });
    
    // 发送请求
    const url = groupId ? `discussion_groups/${groupId}` : 'discussion_groups';
    const method = groupId ? 'PUT' : 'POST';
    
    fetchAPI(url, method, groupData)
    .then(response => {
        // 在关闭模态框前，先将焦点移出按钮
        document.activeElement.blur();
        
        // 延迟关闭模态框，确保焦点已正确处理
        setTimeout(() => {
            // 关闭模态框
            const modalElement = document.getElementById('addGroupModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
            
            // 重新加载讨论组列表
            loadGroups();
            
            // 显示成功消息
            showToast('success', groupId ? '讨论组更新成功' : '讨论组创建成功');
        }, 50);
    })
    .catch(error => {
        console.error('保存讨论组失败:', error);
        showToast('error', '保存讨论组失败');
    });
}

function editGroup(groupId) {
    // console.log("正在编辑讨论组，ID:", groupId); // 添加调试日志
    
    fetchAPI(`discussion_groups/${groupId}`)
    .then(group => {
        // 重置表单
        const form = document.getElementById('addGroupForm');
        form.reset();
        
        // 清除可能存在的旧ID字段
        const oldIdField = form.querySelector('input[name="id"]');
        if (oldIdField) oldIdField.remove();
        
        // 加载角色和模型
        loadRolesForGroupModal();
        loadModelsForGroupModal();
        
        // 设置表单值
        setTimeout(() => {
            // console.log("为表单设置值，组ID:", groupId, "组数据:", group); // 添加调试日志
            
            form.elements['name'].value = group.name;
            form.elements['mode'].value = group.mode;
            form.elements['max_rounds'].value = group.max_rounds || 3;
            
            // 设置总结模型
            if (group.summary_model_id) {
                form.elements['summary_model_id'].value = group.summary_model_id;
            }
            
            // 设置自定义总结提示
            if (group.summary_prompt) {
                form.elements['summary_prompt'].value = group.summary_prompt;
            }
            
            // 选中讨论组包含的角色
            group.role_ids.forEach(roleId => {
                const checkbox = form.querySelector(`input[name="role_ids"][value="${roleId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            // 添加讨论组ID到表单
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'id';
            hiddenInput.value = groupId;
            form.appendChild(hiddenInput);
            
            // 设置自定义发言顺序
            if (typeof setCustomSpeakingOrderForEdit === 'function') {
                setCustomSpeakingOrderForEdit(group);
            }
            
            // 显示模态框
            new bootstrap.Modal(document.getElementById('addGroupModal')).show();
        }, 100);
    })
    .catch(error => {
        console.error('获取讨论组详情失败:', error);
        showToast('error', '获取讨论组详情失败');
    });
}

function deleteGroup(groupId) {
    if (confirm('确定要删除这个讨论组吗？')) {
        fetchAPI(`discussion_groups/${groupId}`, 'DELETE')
        .then(response => {
                loadGroups();
                showToast('success', '讨论组删除成功');
        })
        .catch(error => {
            console.error('删除讨论组失败:', error);
            showToast('error', '删除讨论组失败');
        });
    }
}

function startDiscussion(groupId) {
    const topic = prompt('请输入讨论主题:');
    if (topic) {
        fetch(`/v1/discussions/${groupId}/start`, {  // 更新路径
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic })
        })
        .then(response => response.json())
        .then(data => {
            // 打开讨论详情页面
            window.open(`/discussion.html?id=${data.meeting_id}`, '_blank');
        })
        .catch(error => {
            // 处理错误
        });
    }
}

// 通用的提示消息函数
function showToast(type, message) {
    // 假设页面中有一个toast容器
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    // 根据类型设置颜色
    let bgColor = 'bg-danger';
    if (type === 'success') {
        bgColor = 'bg-success';
        // 添加绿色样式
        toast.style.backgroundColor = '#28a745';
    } else if (type === 'warning') {
        bgColor = 'bg-warning text-dark';
    } else if (type === 'error') {
        bgColor = 'bg-danger';
    }
    
    toast.className = `toast align-items-center text-white ${bgColor} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // 自动删除toast
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// 初始化讨论组模态框
// /* 此函数已删除，统一使用openAddGroupModal */

// 加载角色复选框
function loadRolesForGroupModal() {
    fetchAPI('roles')
    .then(roles => {
        const container = document.getElementById('roleCheckboxes');
        if (!container) {
            // console.log('未找到roleCheckboxes元素，可能在当前页面不存在');
            return; // 提前返回，避免null引用
        }
        
        container.innerHTML = '';
        
        roles.forEach(role => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'form-check me-3 mb-2';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input';
            checkbox.name = 'role_ids';
            checkbox.value = role.id;
            checkbox.id = `role_${role.id}`;
            checkbox.setAttribute('data-role-name', role.name);
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `role_${role.id}`;
            label.textContent = role.name;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            container.appendChild(checkboxDiv);
        });
    })
    .catch(error => {
        console.error('获取角色失败:', error);
        showToast('error', '获取角色失败');
    });
}

// 加载模型下拉框 - 参考现有代码方式加载模型
function loadModelsForGroupModal() {
    fetchAPI('model_configs', 'GET')
    .then(data => {
        // 添加数据格式检查
        if (!Array.isArray(data)) {
            // console.log('模型配置数据格式不正确:', data);
            data = []; // 提供默认空数组
        }
        
        // // console.log('获取到的模型配置数据:', data);
        
        const select = document.querySelector('#addGroupForm select[name="summary_model_id"]');
        if (!select) {
            // console.log('未找到summary_model_id选择器，可能在当前页面不存在');
            return; // 提前返回，避免null引用
        }
        
        // 清空现有选项并添加默认选项
        select.innerHTML = '<option value="" data-translate="useDefaultModel">使用默认模型</option>';
        
        // 检查是否有可用模型
        if (data.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "请先添加模型";
            option.disabled = true;
            select.appendChild(option);
        } else {
            // 填充下拉列表，标记第一个为选中状态
            data.forEach((model, index) => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                
                // 将第一个有效模型设为默认选中
                if (index === 0) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('获取模型配置失败:', error);
        showToast('error', '获取模型配置失败');
        
        // 添加一个默认选项以防API调用失败
        const select = document.querySelector('#addGroupForm select[name="summary_model_id"]');
        if (select) {
            select.innerHTML = '<option value="" data-translate="useDefaultModel">使用默认模型</option>';
        }
    });
}

// 插入总结提示模板函数定义
function insertTemplatePrompt() {
    const textarea = document.querySelector('#addGroupForm textarea[name="summary_prompt"]');
    const templatePrompt = `# 关于"{meeting_topic}"的会议总结

请根据以下会议记录，生成一个结构化的总结：

{history_text}

请提供以下内容：
1. 讨论的主要主题和观点（不超过3点）
2. 讨论中达成的主要共识（如果有）
3. 存在的主要分歧或不同视角（如果有）
4. 提出的解决方案或行动建议
5. 需要进一步讨论或研究的问题

请使用清晰、专业的语言，以结构化的方式呈现总结内容。`;
    
    textarea.value = templatePrompt;
    textarea.focus();
    
    // 显示成功提示
    showToast('success', translations[getCurrentLanguage()].promptTemplateCopied);
}

// 获取当前语言
function getCurrentLanguage() {
    return localStorage.getItem('preferred_language') || 'en';
}

function getCurrentTranslation(key) {
    const lang = getCurrentLanguage();
    const t = translations[lang] || translations['en']; // 默认使用英文
    return t[key] || key; // 如果翻译不存在，返回键名
}

// 在模态框显示后添加事件监听器
const addGroupModal = document.getElementById('addGroupModal');
if (addGroupModal) {
    addGroupModal.addEventListener('shown.bs.modal', function() {
        // 为插入模板按钮添加事件监听器
        const insertTemplateBtn = document.querySelector('.insert-template-btn');
        if (insertTemplateBtn) {
            insertTemplateBtn.addEventListener('click', insertTemplatePrompt);
        }
    });
}

// 添加applyLanguage函数定义（如果尚未存在）
function applyLanguage(lang) {
    // 更新当前语言
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // 更新所有带有data-translate属性的元素
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            // 对于input和textarea，更新placeholder
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.hasAttribute('placeholder')) {
                    el.placeholder = translations[lang][key];
                }
            } else {
                // 对于其他元素，更新内容
                el.textContent = translations[lang][key];
            }
        }
    });
}

// 添加人类角色切换事件
function setupHumanRoleToggle() {
    const isHumanCheckbox = document.getElementById('isHuman');
    const modelSection = document.getElementById('modelSection');
    const parametersSection = document.getElementById('parametersSection');
    const hostRoleSection = document.getElementById('hostRoleSection');
    
    if (isHumanCheckbox) {
        isHumanCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // 如果是人类角色，隐藏模型和参数部分，显示寄生角色选择
                modelSection.style.display = 'none';
                parametersSection.style.display = 'none';
                hostRoleSection.style.display = 'block';
                customSpeakingOrderSection.style.display = 'none';
                
                // 移除model_id的required属性，使其可选
                const modelSelect = document.querySelector('select[name="model_id"]');
                if (modelSelect) {
                    modelSelect.removeAttribute('required');
                }
                
                // 加载所有可寄生的AI角色
                loadHostRoles();
            } else {
                // 如果不是人类角色，显示模型和参数部分，隐藏寄生角色选择
                modelSection.style.display = 'block';
                parametersSection.style.display = 'block';
                hostRoleSection.style.display = 'none';
                customSpeakingOrderSection.style.display = 'block';
                
                // 恢复model_id的required属性
                const modelSelect = document.querySelector('select[name="model_id"]');
                if (modelSelect) {
                    modelSelect.setAttribute('required', '');
                }
            }
        });
    }
}

// 加载寄生角色列表
function loadHostRoles(selectedId = null) {
    const hostRoleSelect = document.querySelector('select[name="host_role_id"]');
    if (!hostRoleSelect) return Promise.reject('无法找到寄生角色选择器');
    
    // 清空所有选项并添加默认“无”选项
    hostRoleSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.setAttribute('data-translate', 'noHostRole');
    defaultOption.textContent = translations[getCurrentLanguage()].noHostRole;
    hostRoleSelect.appendChild(defaultOption);
    
    // 获取所有角色
    return fetchAPI('roles')
        .then(roles => {
            // 过滤出非人类角色
            const aiRoles = roles.filter(role => !role.is_human);
            
            // 添加角色选项
            aiRoles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                hostRoleSelect.appendChild(option);
            });
            
            if (selectedId) {
                hostRoleSelect.value = selectedId;
            }
            
            return roles;
        })
        .catch(error => {
            console.error('加载寄生角色失败:', error);
            showToast('加载寄生角色失败', 'error');
            return Promise.reject(error);
        });
}

// 为角色模态框加载模型
function loadModelsForRoleModal() {
    const modelSelect = document.getElementById('addRoleForm').querySelector('select[name="model_id"]');
    if (!modelSelect) return;
    
    // 清空现有选项
    modelSelect.innerHTML = '';
    
    // 添加默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择模型';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    modelSelect.appendChild(defaultOption);
    
    // 获取模型列表 - 修改为使用model_configs端点
    fetchAPI('model_configs')
        .then(models => {
            // 检查确保models是数组
            if (!Array.isArray(models)) {
                console.error('获取到的模型数据格式不正确:', models);
                return;
            }
            
            // console.log('获取到的模型数据:', models);
            
            // 添加模型选项
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('加载模型列表失败:', error);
            showToast('加载模型列表失败', 'error');
        });
}

// 为会议页面添加人类参与功能（需要在会议页面加载时调用）
function setupHumanParticipation() {
    // 检查是否在会议页面
    if (!window.location.href.includes('discussion.html')) return;
    
    const meetingId = new URLSearchParams(window.location.search).get('id');
    if (!meetingId) return;
    
    // 添加人类参与区域到页面
    const humanParticipationArea = document.createElement('div');
    humanParticipationArea.id = 'humanParticipationArea';
    humanParticipationArea.className = 'human-participation-area';
    humanParticipationArea.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 data-translate="humanInput">人类输入</h5>
            </div>
            <div class="card-body">
                <div id="humanRolesList" class="mb-3">
                    <!-- 人类角色将在这里动态显示 -->
                    <div class="text-center" id="loadingHumanRoles">
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="ms-2">加载人类角色...</span>
                    </div>
                </div>
                <div id="humanInputForm" style="display: none;">
                    <div class="mb-3">
                        <label for="humanRoleSelect" class="form-label">选择角色</label>
                        <select id="humanRoleSelect" class="form-select">
                            <!-- 人类角色选项将在这里添加 -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="humanMessage" class="form-label" data-translate="yourMessage">您的消息</label>
                        <textarea id="humanMessage" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="d-flex justify-content-between">
                        <button id="submitHumanMessage" class="btn btn-primary" data-translate="submitMessage">提交消息</button>
                        <button id="interruptMeeting" class="btn btn-warning" data-translate="interruptMeeting">打断会议</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.querySelector('.meeting-container').appendChild(humanParticipationArea);
    
    // 加载人类角色并设置事件
    loadHumanRoles(meetingId);
    setupHumanInputEvents(meetingId);
    
    // 每5秒刷新一次人类角色状态
    setInterval(() => loadHumanRoles(meetingId), 5000);
}

// 加载会议中的人类角色
function loadHumanRoles(meetingId) {
    fetchAPI(`discussions/${meetingId}/human_roles`)
        .then(roles => {
            const humanRolesList = document.getElementById('humanRolesList');
            const humanRoleSelect = document.getElementById('humanRoleSelect');
            const loadingElement = document.getElementById('loadingHumanRoles');
            const humanInputForm = document.getElementById('humanInputForm');
            
            // 移除加载指示器
            if (loadingElement) loadingElement.style.display = 'none';
            
            // 如果没有人类角色
            if (!roles || roles.length === 0) {
                humanRolesList.innerHTML = '<div class="alert alert-info">此会议没有人类角色参与</div>';
                return;
            }
            
            // 显示输入表单
            if (humanInputForm) humanInputForm.style.display = 'block';
            
            // 更新人类角色列表
            const roleStatusHtml = roles.map(role => `
                <div class="role-status ${role.is_waiting ? 'waiting' : ''}">
                    <span class="role-name">${role.name}</span>
                    ${role.host_role ? `<span class="badge bg-info">寄生于 ${role.host_role}</span>` : ''}
                    ${role.is_waiting ? '<span class="badge bg-warning" data-translate="waitingForInput">等待您的输入...</span>' : ''}
                </div>
            `).join('');
            
            humanRolesList.innerHTML = `
                <div class="human-roles-status mb-3">
                    ${roleStatusHtml}
                </div>
            `;
            
            // 更新角色选择下拉框
            if (humanRoleSelect) {
                // 清除现有选项
                humanRoleSelect.innerHTML = '';
                
                // 添加角色选项
                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.name;
                    option.textContent = `${role.name}${role.host_role ? ` (寄生于 ${role.host_role})` : ''}`;
                    // 如果角色正在等待输入，设为默认选中
                    if (role.is_waiting) {
                        option.selected = true;
                    }
                    humanRoleSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('加载人类角色失败:', error);
            const humanRolesList = document.getElementById('humanRolesList');
            humanRolesList.innerHTML = '<div class="alert alert-danger">无法加载人类角色</div>';
        });
}

// 设置人类输入相关的事件处理
function setupHumanInputEvents(meetingId) {
    // 提交消息按钮
    const submitButton = document.getElementById('submitHumanMessage');
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            submitHumanMessage(meetingId, false);
        });
    }
    
    // 打断会议按钮
    const interruptButton = document.getElementById('interruptMeeting');
    if (interruptButton) {
        interruptButton.addEventListener('click', () => {
            submitHumanMessage(meetingId, true);
        });
    }
    
    // 设置按键事件: Ctrl+Enter提交
    const messageTextarea = document.getElementById('humanMessage');
    if (messageTextarea) {
        messageTextarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                submitHumanMessage(meetingId, false);
            }
        });
    }
}

// 提交人类消息
function submitHumanMessage(meetingId, isInterruption) {
    const humanRoleSelect = document.getElementById('humanRoleSelect');
    const messageTextarea = document.getElementById('humanMessage');
    
    if (!humanRoleSelect || !messageTextarea) return;
    
    const agentName = humanRoleSelect.value;
    const message = messageTextarea.value.trim();
    
    if (!agentName || !message) {
        showToast('请选择角色并输入消息', 'warning');
        return;
    }
    
    // 禁用按钮和输入框
    const submitButton = document.getElementById('submitHumanMessage');
    const interruptButton = document.getElementById('interruptMeeting');
    if (submitButton) submitButton.disabled = true;
    if (interruptButton) interruptButton.disabled = true;
    messageTextarea.disabled = true;
    
    // 发送消息
    fetchAPI(`discussions/${meetingId}/human_input`, 'POST', {
        agent_name: agentName,
        message: message
    })
    .then(response => {
        if (response.success) {
            // 清空消息输入框
            messageTextarea.value = '';
            showToast('消息已提交', 'success');
            
            // 如果是打断，可能需要刷新会议状态
            if (isInterruption) {
                // 可以在这里添加刷新会议状态的逻辑
            }
        } else {
            showToast(response.message || '提交失败', 'error');
        }
    })
    .catch(error => {
        console.error('提交人类消息失败:', error);
        showToast('提交消息失败', 'error');
    })
    .finally(() => {
        // 恢复按钮和输入框
        if (submitButton) submitButton.disabled = false;
        if (interruptButton) interruptButton.disabled = false;
        messageTextarea.disabled = false;
        messageTextarea.focus();
    });
}

// editRole函数重构人类角色切换逻辑
function editRole(roleId) {
    // 获取角色详情
    fetchAPI(`roles/${roleId}`, 'GET')
        .then(role => {
            // 填充表单
            const form = document.getElementById('addRoleForm');
            
            // 重置表单，确保清除所有旧值
            form.reset();
            
            // 移除可能存在的旧ID字段
            const existingIdField = form.querySelector('input[name="id"]');
            if (existingIdField) {
                existingIdField.remove();
            }
            
            // 填充表单字段
            form.elements['name'].value = role.name;
            form.elements['description'].value = role.description || '';
            form.elements['personality'].value = role.personality || '';
            form.elements['skills'].value = (role.skills || []).join(', ');
            form.elements['system_prompt'].value = role.system_prompt || '';
            
            // 加载模型选项
            loadModelsForRoles().then(() => {
                form.elements['model_id'].value = role.model_id;
            });
            
            form.elements['parameters'].value = JSON.stringify(role.parameters || {}, null, 2);
            
            // 添加角色ID到表单
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'id';
            hiddenInput.value = roleId;
            form.appendChild(hiddenInput);
            
            // 设置人类角色相关字段
            const isHumanCheckbox = document.getElementById('isHuman');
            if (isHumanCheckbox) {
                isHumanCheckbox.checked = role.is_human || false;
                
                // 如果是人类角色，隐藏模型和参数部分，显示寄生角色选择
                if (isHumanCheckbox.checked) {
                    const modelSection = document.getElementById('modelSection');
                    const parametersSection = document.getElementById('parametersSection');
                    const hostRoleSection = document.getElementById('hostRoleSection');
                    
                    modelSection.style.display = 'none';
                    parametersSection.style.display = 'none';
                    hostRoleSection.style.display = 'block';
                    
                    // 移除model_id的required属性，使其可选
                    const modelSelect = document.querySelector('select[name="model_id"]');
                    if (modelSelect) {
                        modelSelect.removeAttribute('required');
                    }
                    
                    // 加载所有可寄生的AI角色
                    loadHostRoles(role.host_role_id);
                } else {
                    // 如果不是人类角色，显示模型和参数部分，隐藏寄生角色选择
                    const modelSection = document.getElementById('modelSection');
                    const parametersSection = document.getElementById('parametersSection');
                    const hostRoleSection = document.getElementById('hostRoleSection');
                    
                    modelSection.style.display = 'block';
                    parametersSection.style.display = 'block';
                    hostRoleSection.style.display = 'none';
                    
                    // 恢复model_id的required属性
                    const modelSelect = document.querySelector('select[name="model_id"]');
                    if (modelSelect) {
                        modelSelect.setAttribute('required', '');
                    }
                }
            }
            
            // 显示模态框
            new bootstrap.Modal(document.getElementById('addRoleModal')).show();
        })
        .catch(error => {
            console.error('获取角色详情失败:', error);
            showToast('获取角色详情失败', 'error');
        });
}