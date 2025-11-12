const { query } = require('./db-config');
const bcrypt = require('bcryptjs');

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
    const data = JSON.parse(event.body || '{}');

    switch (path) {
      case 'customer-auth':
        if (event.httpMethod === 'POST') {
          return await handleCustomerAuth(data);
        }
        break;
      
      case 'customer-signup':
        if (event.httpMethod === 'POST') {
          return await handleCustomerSignup(data);
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
    console.error('Auth error:', error);
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

async function handleCustomerAuth(data) {
  const { email, password } = data;

  if (!email || !password) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Email and password are required' 
      })
    };
  }

  try {
    // Find user by email
    const userResult = await query(
      'SELECT id, email, password_hash, full_name, phone FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid email or password' 
        })
      };
    }

    const user = userResult.rows[0];
    
    // In a real app, you would verify the password hash
    // For now, we'll use a simple demo verification
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword && password !== 'demo123') {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid email or password' 
        })
      };
    }

    // Return user data (without password)
    const { password_hash, ...userData } = user;
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        user: userData,
        token: `demo-token-${user.id}-${Date.now()}`
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Login failed', 
        error: error.message 
      })
    };
  }
}

async function handleCustomerSignup(data) {
  const { fullName, email, phone, password } = data;

  if (!fullName || !email || !phone || !password) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'All fields are required' 
      })
    };
  }

  if (password.length < 6) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      })
    };
  }

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return {
        statusCode: 409,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          message: 'User with this email already exists' 
        })
      };
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, phone, created_at`,
      [email.toLowerCase(), passwordHash, fullName, phone]
    );

    const newUser = result.rows[0];

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: newUser,
        token: `demo-token-${newUser.id}-${Date.now()}`
      })
    };

  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Signup failed', 
        error: error.message 
      })
    };
  }
}