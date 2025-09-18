import nodemailer from 'nodemailer';

// Email configuration for e-prescriptions and password reset
export const createEmailTransporter = () => {
    // For development/testing, you can use Gmail or other services
    // For production, consider using services like SendGrid, AWS SES, etc.
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    return transporter;
};

export const sendPasswordResetEmail = async (toEmail, resetLink) => {
    const transporter = createEmailTransporter();
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Reset your password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Password Reset Request</h2>
                <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in 30 minutes.</p>
                <p style="text-align:center;margin:24px 0;">
                  <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a>
                </p>
                <p>If you did not request this, you can safely ignore this email.</p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

// Email templates for e-prescriptions
export const emailTemplates = {
    prescription: {
        subject: (prescriptionNumber) => `E-Prescription ${prescriptionNumber} - Dental Care`,
        html: (prescription, medications, patientName) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c3e50; margin: 0;">🦷 Dental Care</h1>
                        <h2 style="color: #3498db; margin: 10px 0;">E-Prescription</h2>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Prescription Details</h3>
                        <p><strong>Prescription Number:</strong> <span style="color: #e74c3c; font-weight: bold;">${prescription.prescriptionNumber}</span></p>
                        <p><strong>Patient:</strong> ${patientName}</p>
                        <p><strong>Issue Date:</strong> ${prescription.issueDate.toLocaleDateString()}</p>
                        <p><strong>Expiry Date:</strong> ${prescription.expiryDate.toLocaleDateString()}</p>
                    </div>
                    
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #27ae60; margin-top: 0;">Medications</h3>
                        ${medications.map(med => `
                            <div style="border-left: 4px solid #27ae60; padding-left: 15px; margin: 15px 0;">
                                <h4 style="color: #2c3e50; margin: 10px 0;">${med.medicationName}</h4>
                                <p style="margin: 5px 0;"><strong>Dosage:</strong> ${med.dosage}</p>
                                <p style="margin: 5px 0;"><strong>Frequency:</strong> ${med.frequency}</p>
                                <p style="margin: 5px 0;"><strong>Duration:</strong> ${med.duration}</p>
                                <p style="margin: 5px 0;"><strong>Quantity:</strong> ${med.quantity} ${med.dosageForm || 'units'}</p>
                                ${med.instructions ? `<p style="margin: 5px 0;"><strong>Instructions:</strong> ${med.instructions}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #856404; margin-top: 0;">⚠️ Important Information</h3>
                        <ul style="color: #856404;">
                            <li>This prescription is valid until ${prescription.expiryDate.toLocaleDateString()}</li>
                            <li>Please present this to your pharmacist along with valid identification</li>
                            <li>Follow all dosage instructions carefully</li>
                            <li>Contact your dentist if you experience any adverse reactions</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                            This is an encrypted digital prescription. The prescription data is securely stored and transmitted.<br>
                            Generated on ${new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        `
    }
};

// Delivery tracking functions
export const updateDeliveryStatus = async (prisma, prescriptionId, status, additionalData = {}) => {
    const updateData = {
        deliveryStatus: status,
        lastDeliveryAttempt: new Date(),
        deliveryAttempts: {
            increment: 1
        },
        ...additionalData
    };

    if (status === 'SENT' || status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
    }

    return await prisma.prescription.update({
        where: { id: prescriptionId },
        data: updateData
    });
};
