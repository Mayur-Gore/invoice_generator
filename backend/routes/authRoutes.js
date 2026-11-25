const express = require('express');
const router = express.Router();
const dbOperations = require('../db/operations');

/**
 * POST /api/auth/login
 * Plain text comparison login as specifically requested.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, id, password, pass } = req.body;
    const loginId = username || id;
    const loginPass = password || pass;

    if (!loginId || !loginPass) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both ID/Username and Password.'
      });
    }

    const user = await dbOperations.authenticateUser(loginId, loginPass);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid ID or Password. Please try again.'
      });
    }

    // Return authenticated user details
    return res.json({
      success: true,
      message: 'Login successful! Redirecting...',
      user: {
        id: user.username,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    const isDbDown = !dbOperations.isConnected();
    return res.status(isDbDown ? 503 : 500).json({
      success: false,
      message: isDbDown
        ? 'Database connection is not established. Please check your MongoDB password in .env.'
        : error.message
    });
  }
});

/**
 * POST /api/auth/register (Helper endpoint if user wants to add an ID/password via API)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, id, password, pass, name, role } = req.body;
    const loginId = username || id;
    const loginPass = password || pass;

    if (!loginId || !loginPass) {
      return res.status(400).json({
        success: false,
        message: 'Username/ID and password are required.'
      });
    }

    const existing = await dbOperations.findUser(loginId);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this ID/Username already exists.'
      });
    }

    const newUser = await dbOperations.createUser({
      username: loginId,
      id: loginId,
      password: loginPass,
      pass: loginPass,
      name: name || 'Admin',
      role: role || 'admin'
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully in MongoDB (plain text credentials saved).',
      user: {
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/auth/status
 * Check database connection status
 */
router.get('/status', (req, res) => {
  res.json({
    connected: dbOperations.isConnected(),
    message: dbOperations.isConnected()
      ? 'MongoDB is connected and ready.'
      : 'MongoDB is disconnected. Update password in .env to connect.'
  });
});

module.exports = router;
