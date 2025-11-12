// Authentication form handling
document.addEventListener('DOMContentLoaded', function() {
    // Customer Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            
            // Simple validation
            const errors = validateForm(formData);
            if (errors.length > 0) {
                alert('Please fix the following errors:\n' + errors.join('\n'));
                return;
            }
            
            // Simulate login process
            console.log('Customer login attempt:', formData);
            alert('Login functionality will be implemented in Phase 3 with database connection');
            // window.location.href = 'menu.html';
        });
    }
    
    // Customer Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };
            
            // Validation
            const errors = [];
            if (!formData.fullName) errors.push('Full name is required');
            if (!formData.email) errors.push('Email is required');
            if (!formData.phone) errors.push('Phone number is required');
            if (!formData.password) errors.push('Password is required');
            if (formData.password !== formData.confirmPassword) {
                errors.push('Passwords do not match');
            }
            if (formData.password && formData.password.length < 6) {
                errors.push('Password must be at least 6 characters');
            }
            
            if (errors.length > 0) {
                alert('Please fix the following errors:\n' + errors.join('\n'));
                return;
            }
            
            // Simulate signup process
            console.log('Customer signup attempt:', formData);
            alert('Signup functionality will be implemented in Phase 3 with database connection');
            // window.location.href = 'login.html';
        });
    }
    
    // Staff Login Form
    const staffLoginForm = document.getElementById('staffLoginForm');
    if (staffLoginForm) {
        staffLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                staffId: document.getElementById('staffId').value,
                password: document.getElementById('password').value
            };
            
            if (!formData.staffId || !formData.password) {
                alert('Please enter both Staff ID and password');
                return;
            }
            
            console.log('Staff login attempt:', formData);
            alert('Staff login will be implemented in Phase 4');
        });
    }
    
    // Admin Login Form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };
            
            if (!formData.username || !formData.password) {
                alert('Please enter both username and password');
                return;
            }
            
            console.log('Admin login attempt:', formData);
            alert('Admin login will be implemented in Phase 5');
        });
    }
});

// Reuse validation function from main.js
function validateForm(formData) {
    const errors = [];
    
    if (!formData.email) {
        errors.push('Email is required');
    } else if (!isValidEmail(formData.email)) {
        errors.push('Please enter a valid email');
    }
    
    if (!formData.password) {
        errors.push('Password is required');
    } else if (formData.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    return errors;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}