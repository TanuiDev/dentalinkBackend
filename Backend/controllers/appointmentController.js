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
            dentistId,
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

        
        const patientId = req.user.patientId; 
        const dentist = await prisma.dentist.findUnique({
            where: { id: dentistId }
        });

        if (!dentist) {
            return res.status(404).json({
                message: "Dentist not found"
            });
        }

        
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                dentistId,
                appointmentDate: new Date(appointmentDate),
                timeSlot,
                status: {
                    in: ['SCHEDULED', 'CONFIRMED']
                }
            }
        });

        if (existingAppointment) {
            return res.status(400).json({
                message: "This time slot is already booked"
            });
        }

        
        const appointment = await prisma.appointment.create({
            data: {
                patientId,
                dentistId,
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
                patient: {
                    include: {
                        user: {                      }
                    }
                },
                dentist: {
                    include: {
                        user: {
                            
                        }
                    }
                }
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
                                    lastName: true,
                                    emailAddress: true
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
