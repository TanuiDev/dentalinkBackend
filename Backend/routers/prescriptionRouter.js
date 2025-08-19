// import express from 'express';

// import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

// const router = express.Router();

// // All prescription routes require authentication
// router.use(authenticateToken);

// // Create and send e-prescription (Dentists only)
// router.post('/create', requireRole(['DENTIST']), createAndSendPrescription);

// // Get specific prescription (Patients and Dentists)
// router.get('/:prescriptionId', requireRole(['PATIENT', 'DENTIST']), getPrescription);

// // Get all prescriptions for the authenticated user
// router.get('/my-prescriptions', getUserPrescriptions);

// // Resend prescription if delivery failed (Dentists only)
// router.post('/:prescriptionId/resend', requireRole(['DENTIST']), resendPrescription);

// export { router as prescriptionRouter };
