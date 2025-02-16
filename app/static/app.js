// Global variables
let models = [];
let configurations = [];
let stepCounter = 0;
let availableModels = [];
let isManualModelInput = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadModels();
    loadConfigurations();
});

// API calls
async function fetchAPI(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`/v1/${endpoint}`, options);
    if (!response.ok) {
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
    const modelsList = document.getElementById('modelsList');
    modelsList.innerHTML = models.map(model => `
        <div class="card mb-2">
            <div class="card-body">
                <h6 class="card-title">${model.name}</h6>
                <p class="card-text">Type: ${model.type}</p>
                <p class="card-text">Provider: ${model.provider}</p>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-primary" onclick="editModel(${model.id})">Edit</button>
                    <button class="btn btn-sm btn-info" onclick="saveAsModel(${model.id})">Save As</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteModel(${model.id})">Delete</button>
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
    if (!model) {
        showError('Model not found');
        return;
    }

    // Populate form with model data
    const form = document.getElementById('addModelForm');
    form.name.value = model.name;
    form.type.value = model.type;
    form.provider.value = model.provider;
    form.api_key.value = model.api_key;
    form.api_url.value = model.api_url;
    form.model_name.value = model.model_name || '';
    form.system_prompt.value = model.system_prompt || '';
    form.temperature.value = model.temperature;
    form.top_p.value = model.top_p;
    form.max_tokens.value = model.max_tokens;
    form.presence_penalty.value = model.presence_penalty;
    form.frequency_penalty.value = model.frequency_penalty;

    // Add hidden field for model ID
    let idInput = form.querySelector('input[name="model_id"]');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'model_id';
        form.appendChild(idInput);
    }
    idInput.value = modelId;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addModelModal'));
    modal.show();
}

async function saveModel() {
    try {
        const form = document.getElementById('addModelForm');
        const formData = new FormData(form);
        
        // 获取模型名称
        const modelName = isManualModelInput ? 
            document.getElementById('modelNameInput').value :
            document.getElementById('modelNameSelect').value;
            
        if (!modelName) {
            showError('Model name is required');
            return;
        }
        
        const modelData = {
            name: formData.get('name'),
            model_name: modelName,
            type: formData.get('type'),
            provider: formData.get('provider'),
            api_key: formData.get('api_key'),
            api_url: formData.get('api_url'),
            temperature: parseFloat(formData.get('temperature')),
            top_p: parseFloat(formData.get('top_p')),
            max_tokens: parseInt(formData.get('max_tokens')),
            presence_penalty: parseFloat(formData.get('presence_penalty')),
            frequency_penalty: parseFloat(formData.get('frequency_penalty'))
        };
        
        const modelId = formData.get('model_id');
        if (modelId) {
            await fetchAPI(`models/${modelId}`, 'PUT', modelData);
        } else {
            await fetchAPI('models', 'POST', modelData);
        }
        
        await loadModels();
        closeModal('addModelModal');
    } catch (error) {
        console.error('Failed to save model:', error);
        showError('Failed to save model: ' + error.message);
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
    const configsList = document.getElementById('configurationsList');
    configsList.innerHTML = configurations.map(config => {
        console.log('Rendering config:', config);
        return `
            <div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="card-title mb-0">${config.name}</h6>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="form-check form-switch me-2">
                            <input class="form-check-input" type="checkbox" 
                                   ${config.is_active ? 'checked' : ''}
                                   onchange="toggleConfiguration(${config.id}, this.checked)">
                            <label class="form-check-label">Active</label>
                        </div>
                        <button class="btn btn-sm btn-primary me-2" onclick="editConfiguration(${config.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteConfiguration(${config.id})">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
    // 重置表单
    const form = document.getElementById('addModelForm');
    form.reset();
    
    // 重置模型名称输入状态
    isManualModelInput = false;
    const select = document.getElementById('modelNameSelect');
    const input = document.getElementById('modelNameInput');
    select.style.display = 'block';
    input.style.display = 'none';
    
    // 重置模型选择器
    select.innerHTML = '<option value="">Please enter API credentials first</option>';
    select.disabled = false;
    
    // 清除状态信息
    const statusDiv = document.getElementById('modelLoadStatus');
    if (statusDiv) {
        statusDiv.textContent = '';
    }
    
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
    
    const stepHtml = `
        <div class="configuration-step" data-step="${stepCounter}">
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Step ${stepCounter}</h5>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Model</label>
                                <select class="form-select" name="steps[${stepCounter}].model_id" required onchange="updateStepTypeOptions(this)">
                                    ${getModelOptions()}
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Step Type</label>
                                <select class="form-select" name="steps[${stepCounter}].step_type" required>
                                    <option value="reasoning">Reasoning</option>
                                    <option value="execution">Execution</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Step Order</label>
                                <input type="number" class="form-control" name="steps[${stepCounter}].step_order" value="${stepCounter}" required>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">System Prompt</label>
                        <textarea class="form-control" name="steps[${stepCounter}].system_prompt" rows="3"></textarea>
                    </div>
                    <button type="button" class="btn btn-danger" onclick="removeStep(${stepCounter})">Remove Step</button>
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
    const model = models.find(m => m.id === modelId);
    if (!model) {
        showError('Model not found');
        return;
    }

    // 复制模型数据
    const form = document.getElementById('addModelForm');
    form.reset();
    
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
    form.system_prompt.value = model.system_prompt || '';

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addModelModal'));
    modal.show();
}