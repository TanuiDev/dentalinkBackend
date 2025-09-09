import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();



export const createPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params; 
    const { diagnosis, notes, expiryDate, medications } = req.body;

    
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        dentist: { include: { user: true } },
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "CONFIRMED") {
      return res.status(400).json({
        message:
          "Prescription can only be created for confirmed consultations",
      });
    }

    
    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: appointment.id,
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
      include: {
        medications: true,
        appointment: {
          include: {
            patient: { include: { user: true } },
            dentist: { include: { user: true } },
          },
        },
      },
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



export const getPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        medications: true,
        appointment: {
          include: {
            patient: { include: { user: true } },
            dentist: { include: { user: true } },
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    
    const userId = req.user.id;
    const role = req.user.role;

    const isPatient =
      prescription.appointment?.patient?.userId === userId && role === "PATIENT";
    const isDentist =
      prescription.appointment?.dentist?.userId === userId && role === "DENTIST";

    if (!isPatient && !isDentist && role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to view this prescription" });
    }

    res.json({ data: prescription });
  } catch (error) {
    console.error("Error getting prescription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getUserPrescriptions = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let prescriptions;

    if (role === "PATIENT") {
      prescriptions = await prisma.prescription.findMany({
        where: {
          appointment: {
            patient: {
              userId: userId,
            },
          },
        },
        include: {
          medications: true,
          appointment: {
            include: {
              patient: { include: { user: true } },
              dentist: { include: { user: true } },
            },
          },
        },
      });
    } else if (role === "DENTIST") {
      prescriptions = await prisma.prescription.findMany({
        where: {
          appointment: {
            dentist: {
              userId: userId,
            },
          },
        },
        include: {
          medications: true,
          appointment: {
            include: {
              patient: { include: { user: true } },
              dentist: { include: { user: true } },
            },
          },
        },
      });
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({ data: prescriptions });
  } catch (error) {
    console.error("Error getting user prescriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


