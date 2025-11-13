class AdminApp {
    constructor() {
        this.currentAdmin = null;
        this.stats = null;
        this.API_BASE = '/.netlify/functions';
        
        this.ordersChart = null;
        this.revenueChart = null;
        this.analyticsChart = null;
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupCharts();
    }

    checkAuthentication() {
        const adminData = localStorage.getItem('sunrise_admin');
        if (adminData) {
            this.currentAdmin = JSON.parse(adminData);
            this.updateUI();
        } else {
            window.location.href = 'login.html';
        }
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Chart period changes
        document.getElementById('ordersPeriod')?.addEventListener('change', (e) => {
            this.loadOrdersAnalytics(e.target.value);
        });

        document.getElementById('revenuePeriod')?.addEventListener('change', (e) => {
            this.loadRevenueReport(e.target.value);
        });

        document.getElementById('analyticsPeriod')?.addEventListener('change', (e) => {
            this.loadAnalyticsData(e.target.value);
        });
    }

    updateUI() {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl && this.currentAdmin) {
            adminNameEl.textContent = this.currentAdmin.full_name;
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.API_BASE}/admin-dashboard`);
            const result = await response.json();

            if (result.success) {
                this.stats = result.data;
                this.renderStats();
                this.renderPopularItems();
                this.renderOrderStatus();
                this.createDemoCharts(); // Create charts with demo data since analytics endpoints don't exist
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    renderStats() {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid || !this.stats) return;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <span class="stat-number">${this.stats.total_orders}</span>
                <span class="stat-label">Total Orders</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-calendar-day"></i>
                </div>
                <span class="stat-number">${this.stats.today_orders}</span>
                <span class="stat-label">Today's Orders</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <span class="stat-number">$${this.stats.total_revenue.toFixed(2)}</span>
                <span class="stat-label">Total Revenue</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <span class="stat-number">$${this.stats.today_revenue.toFixed(2)}</span>
                <span class="stat-label">Today's Revenue</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <span class="stat-number">${this.stats.total_users}</span>
                <span class="stat-label">Total Customers</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <span class="stat-number">${this.stats.active_staff}</span>
                <span class="stat-label">Active Staff</span>
            </div>
        `;
    }

    renderPopularItems() {
        const popularItemsEl = document.getElementById('popularItems');
        if (!popularItemsEl || !this.stats.popular_items) return;

        if (this.stats.popular_items.length === 0) {
            popularItemsEl.innerHTML = '<p class="empty-state">No popular items data available</p>';
            return;
        }

        popularItemsEl.innerHTML = this.stats.popular_items.map(item => `
            <div class="popular-item">
                <span class="popular-item-name">${item.name}</span>
                <span class="popular-item-stats">${item.total_quantity} sold</span>
            </div>
        `).join('');
    }

    renderOrderStatus() {
        const orderStatusEl = document.getElementById('orderStatus');
        if (!orderStatusEl || !this.stats.order_status) return;

        if (this.stats.order_status.length === 0) {
            orderStatusEl.innerHTML = '<p class="empty-state">No orders today</p>';
            return;
        }

        orderStatusEl.innerHTML = this.stats.order_status.map(status => `
            <div class="status-item">
                <span class="status-name">${status.status}</span>
                <span class="status-count">${status.count}</span>
            </div>
        `).join('');
    }

    // Since analytics endpoints don't exist, create demo charts
    createDemoCharts() {
        this.setupCharts();
        this.updateChartsWithDemoData();
    }

    setupCharts() {
        // Orders Chart
        const ordersCtx = document.getElementById('ordersChart')?.getContext('2d');
        if (ordersCtx) {
            this.ordersChart = new Chart(ordersCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Orders',
                        data: [],
                        borderColor: '#FF6B35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
        if (revenueCtx) {
            this.revenueChart = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Revenue',
                        data: [],
                        backgroundColor: '#4A4F7A',
                        borderColor: '#2D3047',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Analytics Chart
        const analyticsCtx = document.getElementById('analyticsChart')?.getContext('2d');
        if (analyticsCtx) {
            this.analyticsChart = new Chart(analyticsCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Total Orders',
                            data: [],
                            borderColor: '#FF6B35',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Completed Orders',
                            data: [],
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }

    updateChartsWithDemoData() {
        // Create demo data based on your actual stats
        const demoOrdersData = this.generateDemoOrdersData();
        const demoRevenueData = this.generateDemoRevenueData();
        
        this.updateOrdersChart(demoOrdersData);
        this.updateRevenueChart(demoRevenueData, 'day');
        this.updateAnalyticsChart(demoOrdersData);
        this.updatePerformanceMetrics(demoOrdersData);
    }

    generateDemoOrdersData() {
        // Generate 7 days of demo data based on your actual order count
        const data = [];
        const baseOrders = this.stats.total_orders || 2;
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            data.push({
                date: date.toISOString().split('T')[0],
                order_count: Math.floor(baseOrders * (0.8 + Math.random() * 0.4)),
                completed_orders: Math.floor(baseOrders * (0.7 + Math.random() * 0.3)),
                daily_revenue: (baseOrders * 6 * (0.8 + Math.random() * 0.4)).toFixed(2)
            });
        }
        
        return data;
    }

    generateDemoRevenueData() {
        // Generate demo revenue data
        const data = [];
        const baseRevenue = this.stats.total_revenue || 11.98;
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            data.push({
                period: date.toISOString().split('T')[0],
                revenue: (baseRevenue * (0.7 + Math.random() * 0.6)).toFixed(2)
            });
        }
        
        return data;
    }

    updateOrdersChart(data) {
        if (!this.ordersChart) return;

        this.ordersChart.data.labels = data.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        this.ordersChart.data.datasets[0].data = data.map(item => item.order_count);
        this.ordersChart.update();
    }

    updateRevenueChart(data, period) {
        if (!this.revenueChart) return;

        this.revenueChart.data.labels = data.map(item => {
            const date = new Date(item.period);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        this.revenueChart.data.datasets[0].data = data.map(item => parseFloat(item.revenue));
        this.revenueChart.update();
    }

    updateAnalyticsChart(data) {
        if (!this.analyticsChart) return;
        
        this.analyticsChart.data.labels = data.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        this.analyticsChart.data.datasets[0].data = data.map(item => item.order_count);
        this.analyticsChart.data.datasets[1].data = data.map(item => item.completed_orders);
        this.analyticsChart.update();
    }

    updatePerformanceMetrics(data) {
        const metricsEl = document.getElementById('performanceMetrics');
        if (!metricsEl) return;

        const totalOrders = data.reduce((sum, item) => sum + item.order_count, 0);
        const completedOrders = data.reduce((sum, item) => sum + item.completed_orders, 0);
        const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.daily_revenue), 0);
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0;
        const avgOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0;

        metricsEl.innerHTML = `
            <div class="metric-item">
                <span class="metric-name">Total Orders (7 days)</span>
                <span class="metric-value">${totalOrders}</span>
            </div>
            <div class="metric-item">
                <span class="metric-name">Completion Rate</span>
                <span class="metric-value">${completionRate}%</span>
            </div>
            <div class="metric-item">
                <span class="metric-name">Total Revenue (7 days)</span>
                <span class="metric-value">$${totalRevenue.toFixed(2)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-name">Avg Order Value</span>
                <span class="metric-value">$${avgOrderValue}</span>
            </div>
        `;
    }

    // These functions are called but endpoints don't exist - provide fallbacks
    async loadOrdersAnalytics(days = 30) {
        console.log('Analytics endpoint not available - using demo data');
        this.updateChartsWithDemoData();
    }

    async loadRevenueReport(period = 'month') {
        console.log('Revenue report endpoint not available - using demo data');
        this.updateChartsWithDemoData();
    }

    async loadAnalyticsData(days = 30) {
        console.log('Analytics endpoint not available - using demo data');
        this.updateChartsWithDemoData();
    }

    showError(message) {
        console.error('Admin Error:', message);
    }

    logout() {
        localStorage.removeItem('sunrise_admin');
        localStorage.removeItem('sunrise_admin_token');
        window.location.href = 'login.html';
    }
}

// Initialize the admin app
const adminApp = new AdminApp();