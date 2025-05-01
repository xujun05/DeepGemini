/**
 * 自定义发言顺序相关功能
 */

// 获取自定义发言顺序
function getCustomSpeakingOrder() {
    const orderList = document.getElementById('customSpeakingOrderList');
    if (!orderList) return null;
    
    const roleItems = orderList.querySelectorAll('.role-item');
    if (roleItems.length === 0) return null;
    
    const order = [];
    roleItems.forEach(item => {
        order.push(item.getAttribute('data-role-name'));
    });
    
    return order;
}

// 更新自定义发言顺序UI
function updateCustomSpeakingOrderUI() {
    const orderList = document.getElementById('customSpeakingOrderList');
    if (!orderList) return;
    
    // 清空当前列表
    orderList.innerHTML = '';
    
    // 获取选中的角色
    const checkboxes = document.querySelectorAll('#roleCheckboxes input[type="checkbox"]:checked');
    const selectedRoles = [];
    
    checkboxes.forEach(checkbox => {
        const roleId = checkbox.value;
        const roleName = checkbox.getAttribute('data-role-name');
        selectedRoles.push({ id: roleId, name: roleName });
    });
    
    // 添加角色到发言顺序列表
    selectedRoles.forEach(role => {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-item';
        roleItem.setAttribute('data-role-id', role.id);
        roleItem.setAttribute('data-role-name', role.name);
        roleItem.innerHTML = `
            <span class="handle"><i class="fas fa-grip-lines"></i></span>
            <span class="role-name">${role.name}</span>
        `;
        orderList.appendChild(roleItem);
    });
    
    // 初始化拖拽排序
    initSortable();
}

// 初始化可拖拽排序功能
function initSortable() {
    const orderList = document.getElementById('customSpeakingOrderList');
    if (!orderList) return;
    
    // 使用HTML5拖拽 API实现直接交换位置
    const items = orderList.querySelectorAll('.role-item');
    let draggedItem = null;
    let targetItem = null;
    
    items.forEach(item => {
        item.setAttribute('draggable', 'true');
        
        // 开始拖拽
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => this.classList.add('dragging'), 0);
            e.dataTransfer.setData('text/plain', item.getAttribute('data-role-id'));
        });
        
        // 拖拽结束
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
            targetItem = null;
            
            // 清除所有项的拖拽目标样式
            items.forEach(item => {
                item.classList.remove('drag-over');
            });
        });
        
        // 拖拽进入目标区域
        item.addEventListener('dragenter', function(e) {
            e.preventDefault();
            if (this !== draggedItem) {
                this.classList.add('drag-over');
                targetItem = this;
            }
        });
        
        // 拖拽移出目标区域
        item.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
            if (this === targetItem) {
                targetItem = null;
            }
        });
        
        // 拖拽经过目标区域
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        // 放置拖拽项
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (this !== draggedItem) {
                // 直接交换位置
                swapElements(draggedItem, this);
                this.classList.remove('drag-over');
            }
        });
    });
}

// 辅助函数，用于直接交换两个元素的位置
function swapElements(el1, el2) {
    if (!el1 || !el2) return;
    
    // 获取两个元素的父元素
    const parent = el1.parentNode;
    if (!parent) return;
    
    // 获取两个元素的位置
    const el1Next = el1.nextElementSibling;
    const el2Next = el2.nextElementSibling;
    
    // 如果第一个元素是第二个元素的下一个元素
    if (el1Next === el2) {
        parent.insertBefore(el2, el1);
    } 
    // 如果第二个元素是第一个元素的下一个元素
    else if (el2Next === el1) {
        parent.insertBefore(el1, el2);
    } 
    // 其他情况，直接交换位置
    else {
        // 先将第一个元素移到第二个元素的位置
        if (el2Next) {
            parent.insertBefore(el1, el2Next);
        } else {
            parent.appendChild(el1);
        }
        
        // 然后将第二个元素移到第一个元素的原始位置
        if (el1Next) {
            parent.insertBefore(el2, el1Next);
        } else {
            parent.appendChild(el2);
        }
    }
    
    // 添加交换动画效果
    el1.classList.add('swapped');
    el2.classList.add('swapped');
    
    // 移除动画类
    setTimeout(() => {
        el1.classList.remove('swapped');
        el2.classList.remove('swapped');
    }, 300);
}

// 监听角色选择变化，更新发言顺序列表
function setupRoleCheckboxListeners() {
    const checkboxes = document.querySelectorAll('#roleCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCustomSpeakingOrderUI);
    });
}

// 当模式选择改变时更新自定义发言顺序显示
function updateCustomSpeakingOrderVisibility() {
    const modeSelect = document.querySelector('select[name="mode"]');
    const customSpeakingOrderSection = document.getElementById('customSpeakingOrderSection');
    
    if (modeSelect && customSpeakingOrderSection) {
        const mode = modeSelect.value;
        if (mode === 'debate' || mode === 'six_thinking_hats') {
            customSpeakingOrderSection.style.display = 'none';
        } else {
            customSpeakingOrderSection.style.display = 'block';
            updateCustomSpeakingOrderUI();
        }
    }
}

// 初始化自定义发言顺序功能
function initCustomSpeakingOrder() {
    // 监听模式选择变化
    const modeSelect = document.querySelector('select[name="mode"]');
    if (modeSelect) {
        modeSelect.addEventListener('change', updateCustomSpeakingOrderVisibility);
    }
    
    // 初始化时设置可见性
    updateCustomSpeakingOrderVisibility();
    
    // 监听角色选择变化
    setupRoleCheckboxListeners();
}

// 在讨论组模态框显示时初始化
document.addEventListener('DOMContentLoaded', function() {
    const addGroupModal = document.getElementById('addGroupModal');
    if (addGroupModal) {
        addGroupModal.addEventListener('shown.bs.modal', function() {
            initCustomSpeakingOrder();
        });
    }
});

// 设置编辑模式下的自定义发言顺序
function setCustomSpeakingOrderForEdit(groupData) {
    if (!groupData) return;
    
    // console.log('设置自定义发言顺序，组数据:', groupData);
    
    // 使用更长的延迟确保DOM已完全加载
    setTimeout(() => {
        // 先确保所有角色复选框已正确选中
        if (groupData.role_ids && Array.isArray(groupData.role_ids)) {
            groupData.role_ids.forEach(roleId => {
                const checkbox = document.querySelector(`#roleCheckboxes input[value="${roleId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
        
        // 等待复选框状态更新后再处理自定义发言顺序
        setTimeout(() => {
            const orderList = document.getElementById('customSpeakingOrderList');
            if (!orderList) {
                console.error('找不到自定义发言顺序列表元素');
                return;
            }
            
            // 强制清空当前列表
            orderList.innerHTML = '';
            
            // 如果有自定义发言顺序数据，使用它
            if (groupData.custom_speaking_order && Array.isArray(groupData.custom_speaking_order) && groupData.custom_speaking_order.length > 0) {
                // console.log('使用自定义发言顺序:', groupData.custom_speaking_order);
                
                // 创建角色映射对象
                const roleMap = {};
                
                // 使用API响应中的roles数据创建映射
                if (groupData.roles && Array.isArray(groupData.roles)) {
                    groupData.roles.forEach(role => {
                        roleMap[role.name] = role;
                    });
                }
                
                // 按照自定义发言顺序添加角色
                for (let i = 0; i < groupData.custom_speaking_order.length; i++) {
                    const roleName = groupData.custom_speaking_order[i];
                    if (roleMap[roleName]) {
                        const role = roleMap[roleName];
                        // console.log(`按顺序添加角色 ${i+1}: ${roleName} (ID: ${role.id})`);
                        
                        // 直接创建元素并添加到列表中
                        const roleItem = document.createElement('div');
                        roleItem.className = 'role-item';
                        roleItem.setAttribute('data-role-id', role.id);
                        roleItem.setAttribute('data-role-name', roleName);
                        roleItem.innerHTML = `
                            <span class="handle"><i class="fas fa-grip-lines"></i></span>
                            <span class="role-name">${roleName}</span>
                        `;
                        orderList.appendChild(roleItem);
                    } else {
                        console.warn(`找不到角色: ${roleName}`);
                    }
                }
                
                // 添加任何不在自定义发言顺序中的角色
                if (groupData.roles) {
                    const addedRoleNames = new Set(groupData.custom_speaking_order);
                    groupData.roles.forEach(role => {
                        if (!addedRoleNames.has(role.name)) {
                            // console.log(`添加未在自定义顺序中的角色: ${role.name}`);
                            const roleItem = document.createElement('div');
                            roleItem.className = 'role-item';
                            roleItem.setAttribute('data-role-id', role.id);
                            roleItem.setAttribute('data-role-name', role.name);
                            roleItem.innerHTML = `
                                <span class="handle"><i class="fas fa-grip-lines"></i></span>
                                <span class="role-name">${role.name}</span>
                            `;
                            orderList.appendChild(roleItem);
                        }
                    });
                }
            } else {
                // console.log('没有自定义顺序数据，使用默认顺序');
                // 如果没有自定义顺序，使用API返回的角色顺序
                if (groupData.roles && Array.isArray(groupData.roles)) {
                    groupData.roles.forEach(role => {
                        const roleItem = document.createElement('div');
                        roleItem.className = 'role-item';
                        roleItem.setAttribute('data-role-id', role.id);
                        roleItem.setAttribute('data-role-name', role.name);
                        roleItem.innerHTML = `
                            <span class="handle"><i class="fas fa-grip-lines"></i></span>
                            <span class="role-name">${role.name}</span>
                        `;
                        orderList.appendChild(roleItem);
                    });
                }
            }
            
            // 初始化拖拽排序
            initSortable();
        }, 200); // 内部延迟确保复选框状态已更新
    }, 300); // 外部延迟确保DOM已完全加载
}

// 辅助函数：添加角色项到顺序列表
function addRoleItemToOrderList(orderList, roleId, roleName) {
    const roleItem = document.createElement('div');
    roleItem.className = 'role-item';
    roleItem.setAttribute('data-role-id', roleId);
    roleItem.setAttribute('data-role-name', roleName);
    roleItem.innerHTML = `
        <span class="handle"><i class="fas fa-grip-lines"></i></span>
        <span class="role-name">${roleName}</span>
    `;
    orderList.appendChild(roleItem);
}
