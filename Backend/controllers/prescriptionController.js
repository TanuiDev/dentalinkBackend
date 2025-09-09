import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();


export const createPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params; // consultation/appointment id
    const { diagnosis, notes, expiryDate, medications } = req.body;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, dentist: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    
    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        diagnosis,
        notes,
        expiryDate: new Date(expiryDate),
        prescriptionNumber: `RX-${Date.now()}`, 
        medications: {
          create: medications.map((med, index) => ({
            medicationName: med.medicationName,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity,
            refills: med.refills || 0,
            medicationCode: med.medicationCode || null,
            dosageForm: med.dosageForm || null,
            strength: med.strength || null,
            orderOfUse: index + 1,
          })),
        },
      },
      include: { medications: true },
    });   
    res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPrescription = async (req, res) =>{
    try {
        const { prescriptionId } = req.params;
        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId },
        });
    }
    catch (error) {
        console.error("Error getting prescription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserPrescriptions = async (req, res) =>{
    try {
        const prescriptions = await prisma.prescription.findMany({
            where: { userId: req.user.id },
        });
    }
    catch (error) {
        console.error("Error getting user prescriptions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

