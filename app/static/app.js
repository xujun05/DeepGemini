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
        boolean: 'Boolean'
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
        provider: '提供商[推理模型请选择模型归属商]',
        temperature: '温度',
        topP: 'Top P 值',
        presencePenalty: '存在惩罚',
        frequencyPenalty: '频率惩罚',
        maxTokens: '最大令牌数',
        optionalSystemPrompt: '系统提示词（可选）',
        systemPromptPlaceholder: '输入系统提示词以指导模型行为',
        addStep: '添加步骤',
        removeStep: '删除步骤',
        step: '步骤',
        visualizeWorkflow: '接力链可视化',
        apiKeyManagement: 'API 密钥管理',
        generalSettings: '常规设置',
        advancedSettings: '高级设置',
        addNewApiKey: '添加新密钥',
        description: '描述',
        generate: '生成',
        apiKeyFormat: '格式：sk-api-xxxxxxxxxx',
        apiKeyGenerated: 'API 密钥已生成',
        apiKeyInvalid: '无效的 API 密钥格式。应以 "sk-api-" 开头',
        copy: '复制',
        noApiKeys: '暂无 API 密钥',
        workflowName: '接力链名称',
        workflowStatus: '状态',
        saved: '已保存',
        saving: '保存中...',
        copied: '已复制',
        deleted: '已删除',
        confirmDelete: '确认删除？',
        passwordUpdated: '密码已更新',
        passwordMismatch: '两次输入的密码不一致',
        operationSuccess: '操作成功',
        operationFailed: '操作失败',
        accountSettings: '账号设置',
        changePassword: '修改密码',
        currentPassword: '当前密码',
        newPassword: '新密码',
        confirmPassword: '确认密码',
        updatePassword: '更新密码',
        transferContent: '传递内容',
        editWorkflow: '编辑接力链',
        deleteWorkflow: '删除接力链',
        selectModel: '选择模型',
        adminCredentials: '管理员凭据',
        newUsername: '新用户名',
        updateCredentials: '更新凭据',
        logout: '退出登录',
        logoutConfirm: '确定要退出登录吗？',
        customParameters: '自定义参数',
        addParameter: '添加参数',
        parameterName: '参数名称',
        parameterValue: '参数值',
        parameterType: '参数类型',
        removeParameter: '删除',
        string: '字符串',
        number: '数字',
        boolean: '布尔值'
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

    // 工具配置显示控制
    document.getElementById('enableTools').addEventListener('change', function() {
        document.getElementById('toolsConfig').style.display = this.checked ? 'block' : 'none';
    });

    // 思考配置显示控制
    document.getElementById('enableThinking').addEventListener('change', function() {
        document.getElementById('thinkingConfig').style.display = this.checked ? 'block' : 'none';
    });
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
        console.log('Loaded models:', models); // 添加调试日志
        
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
        console.log('Loaded configurations:', configurations);
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
        const config = configurations.find(c => c.id === configId);
        if (!config) {
            showError('Configuration not found');
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
            for (const step of config.steps) {
                addConfigurationStep();
                const stepElement = stepsContainer.querySelector(`[data-step="${stepCounter}"]`);
                if (stepElement) {
                    const modelSelect = stepElement.querySelector('[name$="].model_id"]');
                    const stepTypeSelect = stepElement.querySelector('[name$="].step_type"]');
                    const stepOrderInput = stepElement.querySelector('[name$="].step_order"]');
                    const systemPromptInput = stepElement.querySelector('[name$="].system_prompt"]');
                    
                    if (modelSelect) modelSelect.value = step.model_id;
                    if (stepTypeSelect) stepTypeSelect.value = step.step_type;
                    if (stepOrderInput) stepOrderInput.value = step.step_order;
                    if (systemPromptInput) systemPromptInput.value = step.system_prompt || '';
                    
                    // 更新步骤类型选项
                    if (modelSelect) {
                        updateStepTypeOptions(modelSelect);
                    }
                }
            }
        } else {
            // 如果没有步骤，添加一个默认步骤
            addConfigurationStep();
        }
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('addConfigModal'));
        modal.show();
        
    } catch (error) {
        console.error('Failed to edit configuration:', error);
        showError('Failed to edit configuration');
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
                console.log('Configuration updated successfully');
            } else {
                await fetchAPI('configurations', 'POST', configData);
                console.log('Configuration created successfully');
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
        // Remove active class from all items
        document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');
        
        // Show corresponding page
        const pageId = item.dataset.page + '-page';
        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.add('d-none');
        });
        document.getElementById(pageId).classList.remove('d-none');
    });
});

// Add circular workflow visualization
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

// 添加新的可视化展示函数
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

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.sidebar-toggle i');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    toggleBtn.classList.toggle('fa-chevron-left');
    toggleBtn.classList.toggle('fa-chevron-right');
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
    // 你可以使用更好的提示系统，这里暂时使用 alert
    alert(message);
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