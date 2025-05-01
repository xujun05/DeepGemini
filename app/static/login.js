async function handleLogin(event) {
    event.preventDefault();
    
    const form = document.getElementById('loginForm');
    const alert = document.getElementById('loginAlert');
    const alertMessage = document.getElementById('alertMessage');
    const loginButton = document.getElementById('loginButton');
    
    // 隐藏之前的错误信息
    alert.style.display = 'none';
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // 验证表单
    const username = data.username.trim();
    const password = data.password;
    
    if (username === '' || password === '') {
        showAlert('Please enter both username and password');
        return;
    }
    
    // 禁用按钮并显示加载动画
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Signing in...';
    
    try {
        const response = await fetch('/v1/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        
        const result = await response.json();
        localStorage.setItem('access_token', result.access_token);
        
        // 添加过渡动画
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = '/static/index.html';
        }, 300);
    } catch (error) {
        // 恢复按钮状态
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        
        // 显示错误信息
        showAlert(error.message);
        
        // 添加抖动动画
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 500);
    }
}

// 显示错误提示
function showAlert(message) {
    const alertMessage = document.getElementById('alertMessage');
    const alertBox = document.getElementById('loginAlert');
    
    alertMessage.textContent = message;
    alertBox.style.display = 'block';
    
    setTimeout(function() {
        alertBox.style.display = 'none';
    }, 5000);
}

// 检查是否已登录
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('access_token');
    if (token) {
        window.location.href = '/static/index.html';
    }
    
    // 添加页面淡入效果
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // 获取DOM元素
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
    
    // 密码可见性切换
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // 切换图标
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    // 按钮点击波纹效果
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            // 确保点击事件发生在按钮上而不是其子元素上
            if (e.target !== this) return;
            
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripples = document.createElement('span');
            ripples.classList.add('btn-ripple');
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            
            this.appendChild(ripples);
            
            setTimeout(() => {
                ripples.remove();
            }, 600);
        });
    }
    
    // 密码强度检测
    if (passwordInput && passwordStrength && passwordStrengthMeter) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            
            if (password.length > 0) {
                passwordStrength.style.display = 'block';
                
                // 简单的密码强度检查
                let strength = 0;
                
                // 长度检查
                if (password.length >= 8) strength += 1;
                
                // 包含数字
                if (/\d/.test(password)) strength += 1;
                
                // 包含特殊字符
                if (/[!@#$%^&*]/.test(password)) strength += 1;
                
                // 包含大小写字母
                if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
                
                // 更新强度指示器
                passwordStrengthMeter.className = '';
                
                if (strength === 0) {
                    passwordStrengthMeter.classList.add('strength-weak');
                } else if (strength === 1 || strength === 2) {
                    passwordStrengthMeter.classList.add('strength-medium');
                } else if (strength === 3) {
                    passwordStrengthMeter.classList.add('strength-good');
                } else {
                    passwordStrengthMeter.classList.add('strength-strong');
                }
            } else {
                passwordStrength.style.display = 'none';
            }
        });
    }
    
    // 表单提交处理
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 自动聚焦用户名字段
    const usernameInput = document.getElementById('username');
    if (usernameInput && usernameInput.value.trim() === '') {
        usernameInput.focus();
    }
});

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    body {
        transition: opacity 0.3s ease;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    .btn-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
    }
    
    @keyframes ripple {
        to {
            transform: scale(2.5);
            opacity: 0;
        }
    }
    
    /* 密码强度指示器样式 */
    .password-strength {
        height: 4px;
        border-radius: 2px;
        margin-top: 0.5rem;
        display: none;
        overflow: hidden;
    }
    
    .password-strength-meter {
        height: 100%;
        width: 0%;
        transition: width 0.3s ease, background-color 0.3s ease;
    }
    
    .strength-weak { background-color: #e74c3c; width: 25%; }
    .strength-medium { background-color: #f39c12; width: 50%; }
    .strength-good { background-color: #3498db; width: 75%; }
    .strength-strong { background-color: #2ecc71; width: 100%; }
`;

document.head.appendChild(style); 