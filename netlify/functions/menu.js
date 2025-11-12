const { query } = require('./db-config');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      return await getMenuData();
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Menu API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch menu',
        error: error.message 
      })
    };
  }
};

async function getMenuData() {
  try {
    // Get categories with active menu items
    const categoriesResult = await query(`
      SELECT c.*, 
             COUNT(m.id) as item_count
      FROM categories c
      LEFT JOIN menu_items m ON c.id = m.category_id AND m.is_available = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name
    `);

    // Get menu items
    const menuItemsResult = await query(`
      SELECT m.*, c.name as category_name
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      WHERE m.is_available = true
      ORDER BY c.name, m.name
    `);

    const categories = categoriesResult.rows;
    const menuItems = menuItemsResult.rows;

    // Group menu items by category
    const menuData = categories.map(category => ({
      ...category,
      items: menuItems.filter(item => item.category_id === category.id)
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: menuData,
        count: menuItems.length
      })
    };

  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}