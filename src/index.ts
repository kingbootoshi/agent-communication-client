/**
 * Main application entry point for the Agent Communication API
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import logger from './utils/logger';
import routes from './routes';
import { testConnection } from './db/supabase';
import { DMAgent } from './agent/dmAgent';
import { generateSoundPromptsList } from './utils/soundEffects';
import fs from 'fs';

async function main(): Promise<void> {
  try {
    // Test the Supabase connection
    const connected = await testConnection();
    if (!connected) {
      logger.error('Failed to connect to database, exiting');
      process.exit(1);
    }
    
    // Initialize the DM agent
    await DMAgent.initialize();
    
    // Create Express app
    const app = express();
    const port = parseInt(env.PORT, 10);
    
    // Middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://ipfs.io"],
          connectSrc: ["'self'"]
        }
      }
    })); // Security headers with relaxed CSP for development
    
    app.use(cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'x-api-key'],
    }));
    app.use(express.json()); // Parse JSON bodies
    
    // Apply rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
      limit: parseInt(env.RATE_LIMIT_MAX, 10),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    });
    app.use(limiter);
    
    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, '../public')));
    
    // Ensure public directories exist
    const publicDir = path.join(__dirname, '../public');
    const audioDir = path.join(publicDir, 'audio');
    const imgDir = path.join(publicDir, 'img');
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    
    // API Routes
    app.use('/api', routes);
    
    // Generate sound prompts endpoint
    app.get('/api/generate-sound-prompts', (req, res) => {
      try {
        const promptsText = generateSoundPromptsList();
        
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
          error: error.message
        });
      }
    });
    
    // Serve index.html for root route
    app.get('/', (req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
    
    // Serve API docs
    app.get('/api/docs', (req, res) => {
      res.sendFile(path.join(publicDir, 'api-docs.html'));
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    });
    
    // Start server
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
      logger.info(`Health check available at http://localhost:${port}/health`);
      logger.info(`UI available at http://localhost:${port}`);
      
      // If running in development mode, open the browser
      if (env.NODE_ENV === 'development') {
        logger.info('Opening browser...');
        
        // Use the appropriate open command based on OS
        const { exec } = require('child_process');
        const url = `http://localhost:${port}`;
        
        const command = process.platform === 'win32' ? `start ${url}` :
                       process.platform === 'darwin' ? `open ${url}` :
                       `xdg-open ${url}`;
        
        exec(command);
      }
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the application
main();