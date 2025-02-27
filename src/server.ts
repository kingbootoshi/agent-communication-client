import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import logger from './utils/logger';
import { testAgentManager, agentConfigs } from './agents/testAgents';
import { CharacterProfileService } from './services/characterProfileService';
import { generateSoundPromptsList } from './utils/soundEffects';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api-docs.html'));
});

// API endpoints for managing test agents
app.get('/api/test-agents', (req, res) => {
  try {
    const agentNames = testAgentManager.getAgentNames();
    const agentStates = agentNames.map(name => ({
      name,
      active: testAgentManager.isConversationActive(name)
    }));
    
    res.json({
      success: true,
      agents: agentStates
    });
  } catch (error) {
    logger.error('Error getting test agents:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting test agents',
      error: error.message
    });
  }
});

app.post('/api/test-agents/register/:index', async (req, res) => {
  try {
    logger.info(`TEST: Registering agent with index ${req.params.index}`);
    const index = parseInt(req.params.index, 10);
    
    if (isNaN(index) || index < 0 || index >= agentConfigs.length) {
      logger.warn(`TEST: Invalid agent index: ${req.params.index}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid agent index'
      });
    }
    
    const config = agentConfigs[index];
    logger.info(`TEST: Using agent config for ${config.name} with wallet ${config.walletAddress}`);
    
    // Check if agent already exists
    if (testAgentManager.getAgentNames().includes(config.name)) {
      logger.info(`TEST: Agent ${config.name} already registered`);
      return res.json({
        success: true,
        message: `Agent ${config.name} already registered`,
        agentName: config.name
      });
    }
    
    // Register agent
    logger.info(`TEST: Calling testAgentManager.registerAgent for ${config.name}`);
    try {
      await testAgentManager.registerAgent(config);
      logger.info(`TEST: Successfully registered agent ${config.name}`);
    } catch (registerError) {
      logger.error(`TEST: Error in testAgentManager.registerAgent for ${config.name}:`, registerError);
      // Continue to return success response since we use fallback registration internally
    }
    
    res.json({
      success: true,
      message: `Agent ${config.name} registered successfully`,
      agentName: config.name
    });
  } catch (error) {
    logger.error('TEST: Error in /api/test-agents/register handler:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering test agent',
      error: error.message
    });
  }
});

app.post('/api/test-agents/start/:name', async (req, res) => {
  try {
    const name = req.params.name;
    
    // Check if agent exists
    if (!testAgentManager.getAgentNames().includes(name)) {
      return res.status(404).json({
        success: false,
        message: `Agent ${name} not found`
      });
    }
    
    // Check if conversation already active
    if (testAgentManager.isConversationActive(name)) {
      return res.json({
        success: true,
        message: `Conversation for ${name} is already active`
      });
    }
    
    // Start conversation
    await testAgentManager.startConversation(name);
    
    res.json({
      success: true,
      message: `Started conversation for ${name}`
    });
  } catch (error) {
    logger.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting conversation',
      error: error.message
    });
  }
});

app.post('/api/test-agents/stop/:name', (req, res) => {
  try {
    const name = req.params.name;
    
    // Check if agent exists
    if (!testAgentManager.getAgentNames().includes(name)) {
      return res.status(404).json({
        success: false,
        message: `Agent ${name} not found`
      });
    }
    
    // Stop conversation
    testAgentManager.stopConversation(name);
    
    res.json({
      success: true,
      message: `Stopped conversation for ${name}`
    });
  } catch (error) {
    logger.error('Error stopping conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping conversation',
      error: error.message
    });
  }
});

app.get('/api/test-agents/conversation/:name', (req, res) => {
  try {
    const name = req.params.name;
    
    // Check if agent exists
    if (!testAgentManager.getAgentNames().includes(name)) {
      return res.status(404).json({
        success: false,
        message: `Agent ${name} not found`
      });
    }
    
    // Get conversation history
    const history = testAgentManager.getConversationHistory(name);
    const isActive = testAgentManager.isConversationActive(name);
    
    // Log the actual messages we're sending
    logger.info(`Conversation history for ${name}: ${history.length} messages`);
    
    if (history.length > 0) {
      // Just log the structure of the first message
      logger.info(`First message type: ${typeof history[0]}`);
      if (typeof history[0] === 'object') {
        logger.info(`First message has keys: ${Object.keys(history[0]).join(', ')}`);
      }
    }
    
    // Make sure we're returning a proper array
    const messages = Array.isArray(history) ? history : [];
    
    // Send the response with properly formatted data
    res.json({
      success: true,
      agentName: name,
      isActive,
      messages: messages
    });
  } catch (error) {
    logger.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting conversation history',
      error: error.message
    });
  }
});

// Import API routes
import apiRoutes from './routes';

// API routes
app.use('/api', apiRoutes);

// This endpoint is duplicated in characterRoutes.ts, but we'll keep it here
// for backward compatibility until we fully move to the router approach
app.get('/api/character-profiles', async (req, res) => {
  try {
    logger.info('SERVER: Direct API call to /api/character-profiles');
    const profiles = await CharacterProfileService.getAllCharacterProfiles();
    
    logger.info(`SERVER: Returning ${profiles.length} profiles from direct API endpoint`);
    
    // Log first profile to debug
    if (profiles.length > 0) {
      logger.debug('SERVER: First profile from direct API endpoint:', JSON.stringify(profiles[0], null, 2));
    }
    
    res.json({
      success: true,
      profiles
    });
  } catch (error) {
    logger.error('SERVER: Error getting character profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting character profiles',
      error: error.message
    });
  }
});

// Generate sound prompts file for downloading
app.get('/api/generate-sound-prompts', (req, res) => {
  try {
    const promptsText = generateSoundPromptsList();
    
    // Ensure the public directory exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write the prompts to a file
    const promptsFilePath = path.join(publicDir, 'sound-prompts.md');
    fs.writeFileSync(promptsFilePath, promptsText);
    
    res.json({
      success: true,
      message: 'Sound prompts generated successfully',
      downloadUrl: '/sound-prompts.md'
    });
  } catch (error) {
    logger.error('Error generating sound prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sound prompts',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  
  // If running in development mode, open the browser
  if (process.env.NODE_ENV === 'development') {
    logger.info('Opening browser...');
    
    // Use the appropriate open command based on OS
    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    
    const command = process.platform === 'win32' ? `start ${url}` :
                   process.platform === 'darwin' ? `open ${url}` :
                   `xdg-open ${url}`;
    
    exec(command);
  }
});