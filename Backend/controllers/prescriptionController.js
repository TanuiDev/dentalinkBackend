import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

function getDefaultExpiryDate(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

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

    if (appointment.status !== "COMPLETED") {
      return res.status(400).json({
        message: "Prescription can only be created for completed consultations",
      });
    }

    // Validate medications
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ message: "At least one medication is required" });
    }

    const sanitizedMeds = medications
      .map((m, index) => ({
        medicationName: String(m.medicationName || '').trim(),
        dosage: String(m.dosage || '').trim(),
        frequency: String(m.frequency || '').trim(),
        duration: String(m.duration || '').trim(),
        instructions: m.instructions ? String(m.instructions) : undefined,
        quantity: Number(m.quantity || 0),
        refills: m.refills ? Number(m.refills) : 0,
        medicationCode: m.medicationCode ? String(m.medicationCode) : null,
        dosageForm: m.dosageForm ? String(m.dosageForm) : null,
        strength: m.strength ? String(m.strength) : null,
        orderOfUse: index + 1,
      }))
      .filter(m => m.medicationName && m.dosage && m.frequency && m.duration && m.quantity > 0);

    if (sanitizedMeds.length === 0) {
      return res.status(400).json({ message: "Medication entries are incomplete or invalid" });
    }

    // Parse expiry with default
    let parsedExpiry = expiryDate ? new Date(expiryDate) : getDefaultExpiryDate(30);
    if (Number.isNaN(parsedExpiry.getTime())) {
      parsedExpiry = getDefaultExpiryDate(30);
    }

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: appointment.id,
        diagnosis: diagnosis || null,
        notes: notes || null,
        expiryDate: parsedExpiry,
        prescriptionNumber: `RX-${Date.now()}`,
        medications: {
          create: sanitizedMeds,
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
    res.status(500).json({ message: "Internal server error", error: error.message });
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


