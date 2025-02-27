import { Router, Request, Response } from 'express';
import { testAgentManager, agentConfigs } from '../agents/testAgents';
import logger from '../utils/logger';

const router = Router();

// Get all test agents
router.get('/', async (req: Request, res: Response) => {
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

// Register a test agent
router.post('/register/:index', async (req: Request, res: Response) => {
  try {
    const index = parseInt(req.params.index, 10);
    
    if (isNaN(index) || index < 0 || index >= agentConfigs.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent index'
      });
    }
    
    const config = agentConfigs[index];
    
    // Check if agent already exists
    if (testAgentManager.getAgentNames().includes(config.name)) {
      return res.json({
        success: true,
        message: `Agent ${config.name} already registered`,
        agentName: config.name
      });
    }
    
    // Register agent
    await testAgentManager.registerAgent(config);
    
    res.json({
      success: true,
      message: `Agent ${config.name} registered successfully`,
      agentName: config.name
    });
  } catch (error) {
    logger.error('Error registering test agent:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering test agent',
      error: error.message
    });
  }
});

// Start a conversation
router.post('/start/:name', async (req: Request, res: Response) => {
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

// Stop a conversation
router.post('/stop/:name', (req: Request, res: Response) => {
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

// Get conversation history
router.get('/conversation/:name', (req: Request, res: Response) => {
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
    
    res.json({
      success: true,
      agentName: name,
      isActive,
      messages: history
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

export default router;