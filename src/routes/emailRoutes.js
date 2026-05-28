import { Router } from 'express';
import { verifyEmailController } from '../controllers/emailController.js';

const router = Router();

// Endpoint for email validation
router.post('/verify', verifyEmailController);

export default router;
