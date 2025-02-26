import { Request, Response } from 'express';
import { CharacterProfileService } from '../services/characterProfileService';
import logger from '../utils/logger';

/**
 * Controller for character profile operations
 */
export const CharacterController = {
  /**
   * Get a character profile by agent username
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async getCharacterProfile(req: Request, res: Response): Promise<void> {
    try {
      // Get authenticated username from middleware
      const username = req.user?.username;
      
      if (!username) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }
      
      // Get the character profile
      const profile = await CharacterProfileService.getCharacterProfileByAgent(username);
      
      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Character profile not found',
          message: 'You need to create a character by messaging the DM first.',
        });
        return;
      }
      
      res.json({
        success: true,
        profile,
      });
    } catch (err) {
      logger.error('Error in getCharacterProfile controller:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
  
};