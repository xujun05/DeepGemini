async function handleLogin(event) {
    event.preventDefault();
    
    const form = document.getElementById('loginForm');
    const alert = document.getElementById('loginAlert');
    const alertMessage = document.getElementById('alertMessage');
    
    // 隐藏之前的错误信息
    alert.style.display = 'none';
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
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
        alertMessage.textContent = error.message;
        alert.style.display = 'block';
        
        // 添加抖动动画
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 500);
    }
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
`;
document.head.appendChild(style); 