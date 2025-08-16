import express from 'express';
import {
    getAvailableDentists,
    createAppointment,
    getUserAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    getAvailableTimeSlots
} from '../controllers/appointmentController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/dentists', getAvailableDentists);
router.get('/time-slots', getAvailableTimeSlots);

// Protected routes (authentication required)
router.post('/create', authenticateToken, requireRole(['PATIENT']), createAppointment);
router.get('/my-appointments', authenticateToken, getUserAppointments);
router.patch('/:appointmentId/status', authenticateToken, requireRole(['DENTIST', 'ADMIN']), updateAppointmentStatus);
router.patch('/:appointmentId/cancel', authenticateToken, requireRole(['PATIENT', 'DENTIST', 'ADMIN']), cancelAppointment);

export { router as appointmentRouter };
