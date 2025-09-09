import express from 'express';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';
import { 
  createPrescription, 
  getPrescription, 
  getUserPrescriptions, 
  
} from '../controllers/prescriptionController.js';

const router = express.Router();

// All prescription routes require authentication
router.use(authenticateToken);


router.post(
  '/consultation/:appointmentId',
  requireRole(['DENTIST']),
  createPrescription
);

router.get('/my-prescriptions', getUserPrescriptions);


router.get('/:prescriptionId', requireRole(['PATIENT', 'DENTIST']), getPrescription);


// router.post('/:prescriptionId/resend', requireRole(['DENTIST']), resendPrescription);

export { router as prescriptionRouter };
