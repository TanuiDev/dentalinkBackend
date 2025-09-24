import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();


export const getAvailableDentists = async (_req, res) => {
    try {
        const dentists = await prisma.dentist.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        emailAddress: true,
                        phoneNumber: true
                    }
                }
            }
        });

        res.json({
            message: "Dentists retrieved successfully",
            data: dentists
        });
    } catch (error) {
       
        res.status(500).json({
            message: "Error retrieving dentists",
            error: error.message
        });
    }
};


export const createAppointment = async (req, res) => {
  try {
    const {
      appointmentDate,
      timeSlot,
      duration,
      appointmentType,
      conditionDescription,
      patientAge,
      conditionDuration,
      severity,
      notes
    } = req.body;

    
    const baseDate = new Date(appointmentDate);
    if (Number.isNaN(baseDate.getTime())) {
      return res.status(400).json({ message: 'Invalid appointmentDate' });
    }
    const [hoursStr, minutesStr] = String(timeSlot || '').split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return res.status(400).json({ message: 'Invalid timeSlot' });
    }
    const requestedDateTime = new Date(baseDate);
    requestedDateTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    if (requestedDateTime.getTime() < now.getTime()) {
      return res.status(400).json({ message: 'Appointment time must be in the future' });
    }

    let patientId = req.user.patientId; // logged in patient

    // Ensure patient profile exists
    if (!patientId) {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      patientId = patient.id;
    }

        // Step 1: Find all dentists who are available for the requested time slot
        const availableDentists = await prisma.dentist.findMany({
            where: {
                appointments: {
                    none: {
                        appointmentDate: new Date(appointmentDate),
                        timeSlot,
                        status: { in: ['SCHEDULED', 'CONFIRMED'] }
                    }
                }
            },
            include: {
                appointments: {
                    where: {
                        status: { in: ['SCHEDULED', 'CONFIRMED'] }
                    }
                }
            }
        });

        if (!availableDentists || availableDentists.length === 0) {
            return res.status(400).json({
                message: "No available dentist for this time slot"
            });
        }

        // Step 2: Assign the dentist with the fewest scheduled/confimed appointments (load balancing)
        let assignedDentist = availableDentists[0];
        let minAppointments = assignedDentist.appointments.length;
        for (const dentist of availableDentists) {
            if (dentist.appointments.length < minAppointments) {
                assignedDentist = dentist;
                minAppointments = dentist.appointments.length;
            }
        }

        // Step 3: Create appointment with assigned dentist
        const appointment = await prisma.appointment.create({
            data: {
                patientId,
                dentistId: assignedDentist.id,
                appointmentDate: new Date(appointmentDate),
                timeSlot,
                duration: parseInt(duration),
                appointmentType,
                conditionDescription,
                patientAge: parseInt(patientAge),
                conditionDuration,
                severity,
                notes,
                status: 'SCHEDULED'
            },
            include: {
                patient: { include: { user: true } },
                dentist: { include: { user: true } }
            }
        });

        res.status(201).json({
            message: "Appointment created successfully",
            data: appointment
        });

  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      message: "Error creating appointment",
      error: error.message
    });
  }
};


export const getUserAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let appointments;

        if (userRole === 'PATIENT') {
            const patient = await prisma.patient.findUnique({
                where: { userId }
            });

            if (!patient) {
                return res.status(404).json({
                    message: "Patient profile not found"
                });
            }

            appointments = await prisma.appointment.findMany({
                where: { patientId: patient.id },
                orderBy: { appointmentDate: 'asc' },
                include: {
                    patient: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    emailAddress: true
                                }
                            }
                        }
                    },
                    dentist: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    emailAddress: true
                                }
                            }
                        }
                    }
                }
            });

        } else if (userRole === 'DENTIST') {
            const dentist = await prisma.dentist.findUnique({
                where: { userId }
            });

            if (!dentist) {
                return res.status(404).json({
                    message: "Dentist profile not found"
                });
            }

            appointments = await prisma.appointment.findMany({
                where: { dentistId: dentist.id },
                orderBy: { appointmentDate: 'asc' },
                include: {
                    patient: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    emailAddress: true
                                }
                            }
                        }
                    },
                    dentist: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    }
                }
            });
        } else {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        res.json({
            message: "Appointments retrieved successfully",
            data: appointments
        });

    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({
            message: "Error retrieving appointments",
            error: error.message
        });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const appointment = await prisma.appointment.update({
            where: { id },
            data: {
                status,
                notes: notes || undefined
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                emailAddress: true
                            }
                        }
                    }
                },
                dentist: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        res.json({
            message: "Appointment status updated successfully",
            data: appointment
        });

    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            message: "Error updating appointment",
            error: error.message
        });
    }
};


export const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // First, get the appointment to check ownership and current status
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Check if user has permission to cancel this appointment
        if (userRole === 'PATIENT') {
            // Patients can only cancel their own appointments
            if (appointment.patient.user.id !== userId) {
                return res.status(403).json({
                    message: "You can only cancel your own appointments"
                });
            }
        }
        // DENTIST and ADMIN roles can cancel any appointment (no additional checks needed)

        // Check if appointment is already cancelled
        if (appointment.status === 'CANCELLED') {
            return res.status(400).json({
                message: "Appointment is already cancelled"
            });
        }

        // Check if appointment is already completed
        if (appointment.status === 'COMPLETED') {
            return res.status(400).json({
                message: "Cannot cancel a completed appointment"
            });
        }

        // Update appointment status to cancelled
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'CANCELLED',
                notes: appointment.notes ? `${appointment.notes}\n[Cancelled by ${userRole === 'PATIENT' ? 'patient' : userRole.toLowerCase()}]` : `[Cancelled by ${userRole === 'PATIENT' ? 'patient' : userRole.toLowerCase()}]`
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                emailAddress: true
                            }
                        }
                    }
                },
                dentist: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        res.json({
            message: "Appointment cancelled successfully",
            data: updatedAppointment
        });

    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            message: "Error cancelling appointment",
            error: error.message
        });
    }
};


export const getAvailableTimeSlots = async (req, res) => {
    try {
        const { dentistId, date } = req.query;

        // Define available time slots (you can customize these)
        const availableSlots = [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
        ];

        // Get booked slots for the specified date
        const bookedSlots = await prisma.appointment.findMany({
            where: {
                dentistId,
                appointmentDate: new Date(date),
                status: {
                    in: ['SCHEDULED', 'CONFIRMED']
                }
            },
            select: { timeSlot: true }
        });

        const bookedTimeSlots = bookedSlots.map(slot => slot.timeSlot);
        const availableTimeSlots = availableSlots.filter(slot => !bookedTimeSlots.includes(slot));

        res.json({
            message: "Available time slots retrieved successfully",
            data: {
                date,
                availableSlots: availableTimeSlots,
                bookedSlots: bookedTimeSlots
            }
        });

    } catch (error) {
        console.error('Error getting time slots:', error);
        res.status(500).json({
            message: "Error retrieving time slots",
            error: error.message
        });
    }
};

export const updateAppointmentMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoChatLink, meetingPassword } = req.body;

    if (!videoChatLink || typeof videoChatLink !== 'string') {
      return res.status(400).json({ message: 'videoChatLink is required' });
    }

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { dentist: { include: { user: true } }, patient: { include: { user: true } } },
    });

    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    // Disallow changing link once set
    if (appt.videoChatLink) {
      return res.status(400).json({ message: 'Meeting link already set and cannot be changed' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isAssignedDentist = !!appt.dentist && req.user.dentistId === appt.dentist.id;
    if (!isAdmin && !isAssignedDentist) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        videoChatLink,
        meetingPassword: meetingPassword || undefined,
        status: appt.status === 'SCHEDULED' ? 'CONFIRMED' : appt.status,
      },
      include: {
        patient: { include: { user: true } },
        dentist: { include: { user: true } },
      },
    });

    return res.json({ message: 'Meeting link updated', data: updated });
  } catch (error) {
    console.error('Error updating meeting link:', error);
    return res.status(500).json({ message: 'Error updating meeting link', error: error.message });
  }
};
