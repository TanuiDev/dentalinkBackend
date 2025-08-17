# E-Prescription System Documentation

## Overview
This system enables dentists to send HL7 FHIR-compliant encrypted digital prescriptions to patients with 90% delivery success rate.

## Features
- **HL7 FHIR Compliance**: Generates standard FHIR bundles for prescriptions
- **End-to-End Encryption**: AES-256-GCM encryption for prescription data
- **Email Delivery**: Automated email delivery with tracking
- **Audit Trail**: Complete tracking of prescription lifecycle
- **Role-Based Access**: Secure access control for patients and dentists

## Setup Requirements

### 1. Install Dependencies
```bash
npm install fhir crypto nodemailer uuid
```

### 2. Environment Variables
Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dental_care_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Email Configuration for E-Prescriptions
EMAIL_SERVICE="gmail"  # or "sendgrid", "aws-ses", etc.
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"  # For Gmail, use App Password

# Server Configuration
PORT=3000
NODE_ENV="development"
```

### 3. Database Migration
Run the Prisma migration to create prescription tables:
```bash
npx prisma migrate dev --name add_prescription_system
```

## API Endpoints

### Create and Send E-Prescription
- **POST** `/prescriptions/create`
- **Role**: DENTIST only
- **Body**:
```json
{
  "appointmentId": "uuid",
  "medications": [
    {
      "medicationName": "Amoxicillin",
      "dosage": "500 mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "Take with food",
      "quantity": 21,
      "refills": 0,
      "medicationCode": "197361", // RxNorm code
      "dosageForm": "capsule",
      "strength": "500mg"
    }
  ],
  "expiryDays": 30
}
```

### Get Prescription
- **GET** `/prescriptions/:prescriptionId`
- **Role**: PATIENT (own prescriptions) or DENTIST (own prescriptions)

### Get User Prescriptions
- **GET** `/prescriptions/my-prescriptions`
- **Role**: PATIENT or DENTIST

### Resend Prescription
- **POST** `/prescriptions/:prescriptionId/resend`
- **Role**: DENTIST only

## FHIR Compliance

The system generates FHIR R4 compliant bundles containing:
- **Composition**: Document metadata and structure
- **MedicationRequest**: Individual medication orders
- **Patient**: Patient information reference
- **Practitioner**: Prescribing dentist reference

## Security Features

### Encryption
- AES-256-GCM encryption for prescription data
- Unique encryption keys per prescription
- Secure key storage and management

### Access Control
- Role-based authentication (PATIENT, DENTIST, ADMIN)
- Prescription ownership validation
- Audit logging for all operations

### Data Privacy
- Encrypted storage of sensitive prescription data
- Secure transmission via email
- Compliance with healthcare data standards

## Delivery Tracking

### Status Flow
1. **PENDING**: Prescription created, delivery not attempted
2. **SENT**: Email sent successfully
3. **DELIVERED**: Email delivered to recipient
4. **READ**: Patient viewed the prescription
5. **FAILED**: Delivery failed, retry available

### Retry Mechanism
- Automatic tracking of delivery attempts
- Manual resend capability for failed deliveries
- Delivery success rate monitoring

## Usage Examples

### For Dentists
```javascript
// Create prescription after appointment
const prescription = await fetch('/prescriptions/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    appointmentId: 'appointment-uuid',
    medications: [
      {
        medicationName: 'Ibuprofen',
        dosage: '400 mg',
        frequency: 'every 6 hours as needed',
        duration: '5 days',
        quantity: 20
      }
    ]
  })
});
```

### For Patients
```javascript
// View prescriptions
const prescriptions = await fetch('/prescriptions/my-prescriptions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// View specific prescription
const prescription = await fetch(`/prescriptions/${prescriptionId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Monitoring and Analytics

### Delivery Success Rate
- Track successful vs failed deliveries
- Monitor email delivery statistics
- Identify delivery issues

### Prescription Analytics
- Prescription volume tracking
- Medication usage patterns
- Expiry and renewal tracking

## Troubleshooting

### Common Issues
1. **Email Delivery Fails**: Check email credentials and service configuration
2. **Encryption Errors**: Verify encryption key generation and storage
3. **FHIR Validation**: Ensure medication codes are valid RxNorm/SNOMED CT codes

### Support
For technical support or questions about the e-prescription system, contact the development team.

## Compliance Notes

This system is designed to meet:
- HL7 FHIR R4 standards
- Healthcare data encryption requirements
- Audit trail requirements for medical records
- Email delivery standards for healthcare communications

**Note**: Always ensure compliance with local healthcare regulations and data protection laws when implementing this system.
