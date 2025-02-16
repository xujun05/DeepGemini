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
        updateStepModelOptions();
        
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
        const stepsInfo = config.steps.map((step, index) => {
            const model = models.find(m => m.id === step.model_id);
            return `
                <div class="step-info">
                    Step ${index + 1}: ${model ? model.name : 'Unknown'} 
                    (${step.step_type.charAt(0).toUpperCase() + step.step_type.slice(1)})
                </div>
            `;
        }).join('');

        return `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="card-title mb-0">${config.name}</h6>
                            <div class="steps-container mt-2">
                                ${stepsInfo}
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <div class="form-check form-switch d-inline-block me-2">
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

    const form = document.getElementById('addConfigForm');
    form.name.value = config.name;
    
    // 清空现有步骤
    document.getElementById('configStepsContainer').innerHTML = '';
    configSteps = [];
    
    // 添加配置的所有步骤
    if (config.steps && config.steps.length > 0) {
        config.steps.forEach(step => {
            addConfigurationStep();
            const stepElement = document.querySelector(`.config-step[data-step="${configSteps.length - 1}"]`);
            if (stepElement) {
                const modelSelect = stepElement.querySelector('.step-model');
                modelSelect.value = step.model_id;
                // 更新步骤类型选项
                updateStepTypeOptions(modelSelect);
                // 设置选中的步骤类型
                stepElement.querySelector('.step-type').value = step.step_type;
                stepElement.querySelector('.step-prompt').value = step.system_prompt || '';
            }
        });
    }

    // 添加隐藏的配置ID字段
    let idInput = form.querySelector('input[name="config_id"]');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'config_id';
        form.appendChild(idInput);
    }
    idInput.value = configId;

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addConfigModal'));
    modal.show();
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

// 更新模型类型选项
function updateModelTypeSelect() {
    const typeSelect = document.querySelector('select[name="type"]');
    typeSelect.innerHTML = `
        <option value="reasoning">Reasoning</option>
        <option value="execution">Execution</option>
        <option value="general">General</option>
    `;
}

// 更新配置步骤管理
let configSteps = [];

function addConfigurationStep() {
    const stepContainer = document.getElementById('configStepsContainer');
    const stepIndex = configSteps.length;
    
    const stepHtml = `
        <div class="config-step mb-3" data-step="${stepIndex}">
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">Step ${stepIndex + 1}</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label">Model</label>
                            <select class="form-select step-model" required onchange="updateStepTypeOptions(this)">
                                <option value="">Select a model</option>
                                ${getModelOptions()}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Step Type</label>
                            <select class="form-select step-type" required>
                                <option value="reasoning">Reasoning</option>
                                <option value="execution">Execution</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button type="button" class="btn btn-danger btn-sm" onclick="removeStep(${stepIndex})">
                                Remove Step
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <label class="form-label">System Prompt (Optional)</label>
                        <textarea class="form-control step-prompt" 
                                placeholder="Enter system prompt for this step"></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    stepContainer.insertAdjacentHTML('beforeend', stepHtml);
    configSteps.push({
        model_id: null,
        step_type: 'general',  // 默认使用 general 类型
        order: stepIndex,
        system_prompt: ''
    });
}

function removeStep(index) {
    const stepElement = document.querySelector(`.config-step[data-step="${index}"]`);
    if (stepElement) {
        stepElement.remove();
        configSteps.splice(index, 1);
        // 重新排序剩余步骤
        document.querySelectorAll('.config-step').forEach((el, idx) => {
            el.setAttribute('data-step', idx);
            el.querySelector('.card-title').textContent = `Step ${idx + 1}`;
        });
    }
}

// 更新保存配置的函数
async function saveConfiguration() {
    const form = document.getElementById('addConfigForm');
    const formData = new FormData(form);
    
    // 收集所有步骤的数据
    const steps = [];
    document.querySelectorAll('.config-step').forEach((stepEl, index) => {
        steps.push({
            model_id: parseInt(stepEl.querySelector('.step-model').value),
            step_type: stepEl.querySelector('.step-type').value,
            order: index,
            system_prompt: stepEl.querySelector('.step-prompt').value
        });
    });
    
    const configData = {
        name: formData.get('name'),
        is_active: true,
        steps: steps
    };
    
    try {
        const configId = formData.get('config_id');
        if (configId) {
            await fetchAPI(`configurations/${configId}`, 'PUT', configData);
        } else {
            await fetchAPI('configurations', 'POST', configData);
        }
        
        await loadConfigurations();
        closeModal('addConfigModal');
        form.reset();
        document.getElementById('configStepsContainer').innerHTML = '';
        configSteps = [];
    } catch (error) {
        console.error('Failed to save configuration:', error);
        showError('Failed to save configuration');
    }
}

// 在 app.js 中添加 getModelOptions 函数
function getModelOptions() {
    // 过滤并排序模型列表
    const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));
    
    // 生成选项HTML
    return sortedModels.map(model => {
        const modelType = model.type === 'general' 
            ? '(General)' 
            : model.type === 'reasoning' 
                ? '(Reasoning)' 
                : '(Execution)';
                
        return `<option value="${model.id}">${model.name} - ${modelType} - ${model.provider}</option>`;
    }).join('');
}

// 更新配置步骤的模型选择器
function updateStepModelOptions() {
    document.querySelectorAll('.step-model').forEach(select => {
        select.innerHTML = getModelOptions();
    });
}

// 添加新函数来更新步骤类型选项
function updateStepTypeOptions(modelSelect) {
    const stepElement = modelSelect.closest('.config-step');
    const stepTypeSelect = stepElement.querySelector('.step-type');
    const selectedModel = models.find(m => m.id === parseInt(modelSelect.value));
    
    if (selectedModel) {
        // 如果是通用模型，显示所有选项
        if (selectedModel.type === 'general') {
            stepTypeSelect.innerHTML = `
                <option value="general">General</option>
                <option value="reasoning">Reasoning</option>
                <option value="execution">Execution</option>
            `;
        } 
        // 如果是特定类型模型，只显示对应选项和通用选项
        else {
            stepTypeSelect.innerHTML = `
                <option value="general">General</option>
                <option value="${selectedModel.type}">${
                    selectedModel.type.charAt(0).toUpperCase() + 
                    selectedModel.type.slice(1)
                }</option>
            `;
        }
        
        // 如果当前选中的类型不在新的选项中，默认选择第一个选项
        if (!stepTypeSelect.querySelector(`option[value="${stepTypeSelect.value}"]`)) {
            stepTypeSelect.value = stepTypeSelect.querySelector('option').value;
        }
    } else {
        // 如果没有选择模型，显示所有选项
        stepTypeSelect.innerHTML = `
            <option value="general">General</option>
            <option value="reasoning">Reasoning</option>
            <option value="execution">Execution</option>
        `;
    }
}