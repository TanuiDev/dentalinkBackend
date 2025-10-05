import express from 'express';
import {
  getAllPayments,
  getPaymentStats,
  getPaymentById,
  generatePaymentReport
} from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All payment routes require authentication
router.use(authenticateToken);

// Admin-only routes (check if user is admin)
router.use(requireRole(['ADMIN']));

// Get all payments with filtering and pagination
router.get('/', getAllPayments);

// Get payment statistics and analytics
router.get('/stats', getPaymentStats);

// Get payment by ID
router.get('/:id', getPaymentById);

// Generate payment report
router.get('/reports/generate', generatePaymentReport);

export default router;
