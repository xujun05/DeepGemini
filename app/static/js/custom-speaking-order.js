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
    
    // 使用HTML5拖拽API实现简单排序
    const items = orderList.querySelectorAll('.role-item');
    
    items.forEach(item => {
        item.setAttribute('draggable', 'true');
        
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', item.getAttribute('data-role-id'));
            this.classList.add('dragging');
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    
    orderList.addEventListener('dragover', function(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(orderList, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            orderList.appendChild(draggable);
        } else {
            orderList.insertBefore(draggable, afterElement);
        }
    });
}

// 辅助函数，用于确定拖拽元素的放置位置
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.role-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
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
    
    // 等待DOM更新完成后再设置自定义发言顺序
    setTimeout(() => {
        const orderList = document.getElementById('customSpeakingOrderList');
        if (!orderList) return;
        
        // 清空当前列表
        orderList.innerHTML = '';
        
        // 如果有自定义发言顺序数据，使用它
        if (groupData.custom_speaking_order && Array.isArray(groupData.custom_speaking_order)) {
            // 获取所有选中的角色
            const selectedRoles = [];
            const checkboxes = document.querySelectorAll('#roleCheckboxes input[type="checkbox"]:checked');
            checkboxes.forEach(checkbox => {
                const roleId = parseInt(checkbox.value);
                const roleName = checkbox.getAttribute('data-role-name');
                selectedRoles.push({ id: roleId, name: roleName });
            });
            
            // 创建一个映射，方便查找角色信息
            const roleMap = {};
            selectedRoles.forEach(role => {
                roleMap[role.name] = role;
            });
            
            // 首先添加自定义顺序中的角色
            groupData.custom_speaking_order.forEach(roleName => {
                if (roleMap[roleName]) {
                    const role = roleMap[roleName];
                    addRoleItemToOrderList(orderList, role.id, role.name);
                    // 从映射中删除，表示已处理
                    delete roleMap[roleName];
                }
            });
            
            // 添加剩余的选中角色（可能是新选择的，不在自定义顺序中的）
            Object.values(roleMap).forEach(role => {
                addRoleItemToOrderList(orderList, role.id, role.name);
            });
        } else {
            // 如果没有自定义顺序，使用默认顺序（按照选中的角色顺序）
            updateCustomSpeakingOrderUI();
        }
        
        // 初始化拖拽排序
        initSortable();
    }, 100);
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
