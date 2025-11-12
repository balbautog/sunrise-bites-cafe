const { query } = require('./db-config');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path.split('/').pop();
    
    switch (path) {
      case 'admin-management':
        if (event.httpMethod === 'GET') {
          return await getDashboardStats();
        }
        break;
      
      case 'menu-items':
        if (event.httpMethod === 'GET') {
          return await getMenuItems(event.queryStringParameters);
        }
        if (event.httpMethod === 'POST') {
          return await createMenuItem(JSON.parse(event.body || '{}'));
        }
        if (event.httpMethod === 'PUT') {
          return await updateMenuItem(JSON.parse(event.body || '{}'));
        }
        break;
      
      case 'categories':
        if (event.httpMethod === 'GET') {
          return await getCategories();
        }
        if (event.httpMethod === 'POST') {
          return await createCategory(JSON.parse(event.body || '{}'));
        }
        if (event.httpMethod === 'PUT') {
          return await updateCategory(JSON.parse(event.body || '{}'));
        }
        break;
      
      case 'users':
        if (event.httpMethod === 'GET') {
          return await getUsers(event.queryStringParameters);
        }
        if (event.httpMethod === 'PUT') {
          return await updateUser(JSON.parse(event.body || '{}'));
        }
        break;
      
      case 'staff':
        if (event.httpMethod === 'GET') {
          return await getStaff();
        }
        if (event.httpMethod === 'POST') {
          return await createStaff(JSON.parse(event.body || '{}'));
        }
        if (event.httpMethod === 'PUT') {
          return await updateStaff(JSON.parse(event.body || '{}'));
        }
        break;
      
      case 'orders-analytics':
        if (event.httpMethod === 'GET') {
          return await getOrdersAnalytics(event.queryStringParameters);
        }
        break;
      
      case 'revenue-report':
        if (event.httpMethod === 'GET') {
          return await getRevenueReport(event.queryStringParameters);
        }
        break;
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('Admin management error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      })
    };
  }
};

// Dashboard Statistics
async function getDashboardStats() {
  try {
    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    // Execute multiple queries in parallel
    const [
      totalOrdersResult,
      todayOrdersResult,
      totalRevenueResult,
      todayRevenueResult,
      totalUsersResult,
      activeStaffResult,
      popularItemsResult,
      orderStatusResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM orders'),
      query('SELECT COUNT(*) as count FROM orders WHERE created_at >= $1', [startOfToday]),
      query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = $1', ['completed']),
      query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = $1 AND created_at >= $1', ['completed', startOfToday]),
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM staff WHERE is_active = true'),
      query(`
        SELECT mi.name, COUNT(oi.id) as order_count, SUM(oi.quantity) as total_quantity
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= $1
        GROUP BY mi.id, mi.name
        ORDER BY total_quantity DESC
        LIMIT 5
      `, [startOfYesterday]),
      query(`
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE created_at >= $1
        GROUP BY status
      `, [startOfToday])
    ]);

    const stats = {
      total_orders: parseInt(totalOrdersResult.rows[0].count),
      today_orders: parseInt(todayOrdersResult.rows[0].count),
      total_revenue: parseFloat(totalRevenueResult.rows[0].total),
      today_revenue: parseFloat(todayRevenueResult.rows[0].total),
      total_users: parseInt(totalUsersResult.rows[0].count),
      active_staff: parseInt(activeStaffResult.rows[0].count),
      popular_items: popularItemsResult.rows,
      order_status: orderStatusResult.rows
    };

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: stats
      })
    };

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch dashboard stats', 
        error: error.message 
      })
    };
  }
}

// Menu Items Management
async function getMenuItems(queryParams = {}) {
  try {
    const { category_id, available_only } = queryParams;
    
    let whereClause = '';
    let params = [];
    
    if (category_id) {
      whereClause = 'WHERE mi.category_id = $1';
      params = [category_id];
    }
    
    if (available_only === 'true') {
      whereClause = whereClause ? `${whereClause} AND mi.is_available = true` : 'WHERE mi.is_available = true';
    }

    const result = await query(`
      SELECT 
        mi.*,
        c.name as category_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.menu_item_id = mi.id) as times_ordered
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      ${whereClause}
      ORDER BY c.name, mi.name
    `, params);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: result.rows
      })
    };

  } catch (error) {
    console.error('Get menu items error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch menu items', 
        error: error.message 
      })
    };
  }
}

async function createMenuItem(data) {
  const { name, description, price, category_id, preparation_time, is_available } = data;

  if (!name || !price || !category_id) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Name, price, and category are required' 
      })
    };
  }

  try {
    const result = await query(`
      INSERT INTO menu_items (name, description, price, category_id, preparation_time, is_available)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description, parseFloat(price), parseInt(category_id), preparation_time || 15, is_available !== false]);

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Menu item created successfully',
        data: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Create menu item error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to create menu item', 
        error: error.message 
      })
    };
  }
}

async function updateMenuItem(data) {
  const { id, name, description, price, category_id, preparation_time, is_available } = data;

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Menu item ID is required' 
      })
    };
  }

  try {
    const result = await query(`
      UPDATE menu_items 
      SET name = $1, description = $2, price = $3, category_id = $4, 
          preparation_time = $5, is_available = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, description, parseFloat(price), parseInt(category_id), preparation_time, is_available, id]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Menu item not found' 
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Menu item updated successfully',
        data: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Update menu item error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to update menu item', 
        error: error.message 
      })
    };
  }
}

// Categories Management
async function getCategories() {
  try {
    const result = await query(`
      SELECT c.*, 
             COUNT(mi.id) as item_count,
             SUM(CASE WHEN mi.is_available THEN 1 ELSE 0 END) as available_items
      FROM categories c
      LEFT JOIN menu_items mi ON c.id = mi.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: result.rows
      })
    };

  } catch (error) {
    console.error('Get categories error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch categories', 
        error: error.message 
      })
    };
  }
}

async function createCategory(data) {
  const { name, description, is_active } = data;

  if (!name) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Category name is required' 
      })
    };
  }

  try {
    const result = await query(`
      INSERT INTO categories (name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description, is_active !== false]);

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Category created successfully',
        data: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Create category error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to create category', 
        error: error.message 
      })
    };
  }
}

async function updateCategory(data) {
  const { id, name, description, is_active } = data;

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Category ID is required' 
      })
    };
  }

  try {
    const result = await query(`
      UPDATE categories 
      SET name = $1, description = $2, is_active = $3
      WHERE id = $4
      RETURNING *
    `, [name, description, is_active, id]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Category not found' 
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Category updated successfully',
        data: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Update category error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to update category', 
        error: error.message 
      })
    };
  }
}

// Users Management
async function getUsers(queryParams = {}) {
  try {
    const { limit = 100, offset = 0 } = queryParams;
    
    const result = await query(`
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.user_id = u.id AND o.status = 'completed') as total_spent
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    const totalResult = await query('SELECT COUNT(*) as count FROM users');

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: result.rows,
        total: parseInt(totalResult.rows[0].count)
      })
    };

  } catch (error) {
    console.error('Get users error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch users', 
        error: error.message 
      })
    };
  }
}

async function updateUser(data) {
  const { id, full_name, phone, is_active } = data;

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'User ID is required' 
      })
    };
  }

  try {
    const result = await query(`
      UPDATE users 
      SET full_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [full_name, phone, id]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          message: 'User not found' 
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'User updated successfully',
        data: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Update user error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to update user', 
        error: error.message 
      })
    };
  }
}

// Staff Management
async function getStaff() {
  try {
    const result = await query(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM order_status_history osh 
         WHERE osh.notes LIKE '%by staff ' || s.staff_id || '%') as actions_count
      FROM staff s
      ORDER BY s.is_active DESC, s.role, s.full_name
    `);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: result.rows
      })
    };

  } catch (error) {
    console.error('Get staff error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch staff', 
        error: error.message 
      })
    };
  }
}

async function createStaff(data) {
  const { staff_id, full_name, role, password } = data;

  if (!staff_id || !full_name || !role || !password) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'All fields are required' 
      })
    };
  }

  try {
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(`
      INSERT INTO staff (staff_id, full_name, role, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, staff_id, full_name, role, is_active, created_at
    `, [staff_id.toUpperCase(), full_name, role, passwordHash]);

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Staff member created successfully',
        data: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Create staff error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to create staff member', 
        error: error.message 
      })
    };
  }
}

async function updateStaff(data) {
  const { id, staff_id, full_name, role, is_active } = data;

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Staff ID is required' 
      })
    };
  }

  try {
    const result = await query(`
      UPDATE staff 
      SET staff_id = $1, full_name = $2, role = $3, is_active = $4
      WHERE id = $5
      RETURNING id, staff_id, full_name, role, is_active, created_at
    `, [staff_id, full_name, role, is_active, id]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Staff member not found' 
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Staff member updated successfully',
        data: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Update staff error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to update staff member', 
        error: error.message 
      })
    };
  }
}

// Analytics
async function getOrdersAnalytics(queryParams = {}) {
  try {
    const { days = 30 } = queryParams;
    
    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as daily_revenue,
        AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as avg_order_value
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: result.rows
      })
    };

  } catch (error) {
    console.error('Get orders analytics error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch analytics', 
        error: error.message 
      })
    };
  }
}

async function getRevenueReport(queryParams = {}) {
  try {
    const { period = 'month' } = queryParams;
    
    let groupBy, interval;
    switch (period) {
      case 'day':
        groupBy = 'DATE(created_at)';
        interval = '7 days';
        break;
      case 'week':
        groupBy = 'EXTRACT(YEAR FROM created_at) || \'-\' || EXTRACT(WEEK FROM created_at)';
        interval = '12 weeks';
        break;
      case 'month':
      default:
        groupBy = 'EXTRACT(YEAR FROM created_at) || \'-\' || EXTRACT(MONTH FROM created_at)';
        interval = '12 months';
        break;
    }

    const result = await query(`
      SELECT 
        ${groupBy} as period,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue,
        AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as avg_order_value
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: result.rows,
        period: period
      })
    };

  } catch (error) {
    console.error('Get revenue report error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch revenue report', 
        error: error.message 
      })
    };
  }
}