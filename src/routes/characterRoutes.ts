import { Router } from 'express';
import { CharacterController } from '../controllers/characterController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All character routes require authentication
router.get('/profile', authenticate, CharacterController.getCharacterProfile);

export default router;