// Global variables
let models = [];
let configurations = [];

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
        // Get model configurations
        const response = await fetchAPI('model_configs');
        models = response;
        
        // Get available models in OpenAI format
        const modelsResponse = await fetchAPI('models');
        const availableModels = modelsResponse.data;
        
        updateModelsList();
        updateModelSelects();
        
        // Update model name selection dropdowns with available models
        const modelNameSelects = document.querySelectorAll('.model-name-select');
        modelNameSelects.forEach(select => {
            select.innerHTML = availableModels.map(model =>
                `<option value="${model.id}">${model.id}</option>`
            ).join('');
        });
    } catch (error) {
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
                <button class="btn btn-sm btn-primary" onclick="editModel(${model.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteModel(${model.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateModelSelects() {
    const reasoningSelect = document.querySelector('select[name="reasoning_model_id"]');
    const executionSelect = document.querySelector('select[name="execution_model_id"]');
    
    if (!reasoningSelect || !executionSelect) return;
    
    // Filter models by type
    const reasoningModels = models.filter(m => m.type === 'reasoning');
    const executionModels = models.filter(m => m.type === 'execution');
    
    // Update reasoning model select
    reasoningSelect.innerHTML = reasoningModels.map(model =>
        `<option value="${model.id}">${model.name} (${model.provider})</option>`
    ).join('');
    
    // Update execution model select
    executionSelect.innerHTML = executionModels.map(model =>
        `<option value="${model.id}">${model.name} (${model.provider})</option>`
    ).join('');
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
    const form = document.getElementById('addModelForm');
    const formData = new FormData(form);
    const modelData = Object.fromEntries(formData.entries());
    
    try {
        const modelId = modelData.model_id;
        delete modelData.model_id; // Remove ID from data to be sent
        
        if (modelId) {
            // Update existing model
            await fetchAPI(`models/${modelId}`, 'PUT', modelData);
        } else {
            // Create new model
            await fetchAPI('models', 'POST', modelData);
        }
        
        await loadModels();
        closeModal('addModelModal');
        form.reset();
        // Remove the hidden model_id field
        const idInput = form.querySelector('input[name="model_id"]');
        if (idInput) idInput.remove();
    } catch (error) {
        showError('Failed to save model');
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
    const config = configurations.find(c => c.id === configId);
    if (!config) {
        showError('Configuration not found');
        return;
    }

    // 打印调试信息
    console.log('Editing configuration:', config);

    const form = document.getElementById('addConfigForm');
    
    // 确保所有字段都被正确设置
    form.name.value = config.name || '';
    form.reasoning_model_id.value = config.reasoning_model_id || '';
    form.execution_model_id.value = config.execution_model_id || '';
    form.reasoning_pattern.value = config.reasoning_pattern || '';
    
    // 明确设置系统提示词字段
    const reasoningPromptField = form.querySelector('[name="reasoning_system_prompt"]');
    const executionPromptField = form.querySelector('[name="execution_system_prompt"]');
    
    if (reasoningPromptField) {
        reasoningPromptField.value = config.reasoning_system_prompt || '';
        console.log('Setting reasoning prompt:', config.reasoning_system_prompt);
    }
    
    if (executionPromptField) {
        executionPromptField.value = config.execution_system_prompt || '';
        console.log('Setting execution prompt:', config.execution_system_prompt);
    }

    // Add hidden field for config ID
    let idInput = form.querySelector('input[name="config_id"]');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'config_id';
        form.appendChild(idInput);
    }
    idInput.value = configId;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addConfigModal'));
    modal.show();
}

async function saveConfiguration() {
    const form = document.getElementById('addConfigForm');
    const formData = new FormData(form);
    const configData = Object.fromEntries(formData.entries());
    
    try {
        // 验证配置名称是否已存在
        if (!configData.config_id) {  // 只在创建新配置时检查
            const existingConfig = configurations.find(c => c.name === configData.name);
            if (existingConfig) {
                showError('Configuration name already exists. Please choose a different name.');
                return;
            }
        }

        const configId = configData.config_id;
        delete configData.config_id; // Remove ID from data to be sent
        
        // 确保系统提示词被包含在数据中
        if (!configData.reasoning_system_prompt) {
            configData.reasoning_system_prompt = "";
        }
        if (!configData.execution_system_prompt) {
            configData.execution_system_prompt = "";
        }
        
        if (configId) {
            // Update existing configuration
            await fetchAPI(`configurations/${configId}`, 'PUT', configData);
        } else {
            // Create new configuration
            await fetchAPI('configurations', 'POST', configData);
        }
        
        await loadConfigurations();
        closeModal('addConfigModal');
        form.reset();
        // Remove the hidden config_id field
        const idInput = form.querySelector('input[name="config_id"]');
        if (idInput) idInput.remove();
    } catch (error) {
        console.error('Failed to save configuration:', error);
        showError('Failed to save configuration');
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

// 添加配置名称验证
function validateConfigurationName(name) {
    const nameInput = document.querySelector('#addConfigForm input[name="name"]');
    const existingConfig = configurations.find(c => c.name === name);
    
    if (existingConfig) {
        nameInput.setCustomValidity('Configuration name already exists');
        return false;
    }
    
    nameInput.setCustomValidity('');
    return true;
}

// 添加表单验证
document.getElementById('addConfigForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nameInput = this.querySelector('input[name="name"]');
    if (!validateConfigurationName(nameInput.value)) {
        showError('Configuration name already exists. Please choose a different name.');
        return;
    }
    saveConfiguration();
});

// Utility functions
function getModelName(id) {
    const model = models.find(m => m.id === id);
    return model ? model.name : 'Unknown';
}

function showAddModelModal() {
    const modal = new bootstrap.Modal(document.getElementById('addModelModal'));
    modal.show();
}

function showAddConfigModal() {
    const modal = new bootstrap.Modal(document.getElementById('addConfigModal'));
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