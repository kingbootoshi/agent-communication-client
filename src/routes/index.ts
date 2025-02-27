import { Router } from 'express';
import agentRoutes from './agentRoutes';
import messageRoutes from './messageRoutes';
import characterRoutes from './characterRoutes';
import testAgentRoutes from './testAgentRoutes';
import logger from '../utils/logger';

const router = Router();

// Add debugging middleware for all API routes
router.use((req, res, next) => {
  logger.info(`API Route Accessed: ${req.method} ${req.originalUrl}`);
  logger.debug('Request Body:', req.body);
  
  // Log response after it's sent
  const originalSend = res.send;
  res.send = function(body) {
    // Don't stringify the response body as it breaks the output
    logger.debug(`Response for ${req.method} ${req.originalUrl}: [Response sent]`);
    return originalSend.call(this, body);
  };
  
  next();
});

// API routes
router.use('/agents', agentRoutes);
router.use('/messages', messageRoutes);
router.use('/characters', characterRoutes);
router.use('/test-agents', testAgentRoutes);

// Fallback route handler for any unmatched routes
router.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'API route not found',
    availableRoutes: [
      '/api/agents',
      '/api/messages',
      '/api/characters',
      '/api/test-agents'
    ]
  });
});

export default router;