import pkg from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const createUser = async (req, res) => {
    const {firstName,lastName,emailAddress,userName,password,address,city,state,phoneNumber,dateOfBirth,role, ...roleSpecificData} = req.body

    const hashedPassword = await bcrypt.hash(password,10)

    try{
        
        const user = await prisma.user.create({
            data:{
                firstName,
                lastName,
                emailAddress,
                userName,
                password:hashedPassword,
                address,
                city,
                state,
                phoneNumber,
                dateOfBirth: new Date(dateOfBirth),
                role: role || 'PATIENT'
            }
        })
        
        // Create role-specific profile
        let profile;
        if (role === 'DENTIST') {
            profile = await prisma.dentist.create({
                data: {
                    userId: user.id,
                    dentistId: roleSpecificData.dentistId,
                    specialization: roleSpecificData.specialization,
                    education: roleSpecificData.education,
                    experience: parseInt(roleSpecificData.experience),
                    bio: roleSpecificData.bio,
                    availability: roleSpecificData.availability,
                    hourlyRate: parseFloat(roleSpecificData.hourlyRate)
                }
            });
        } else if (role === 'PATIENT') {
            profile = await prisma.patient.create({
                data: {
                    userId: user.id,
                    emergencyContact: roleSpecificData.emergencyContact,
                    insuranceProvider: roleSpecificData.insuranceProvider,
                    insuranceNumber: roleSpecificData.insuranceNumber,
                    medicalHistory: roleSpecificData.medicalHistory,
                    allergies: roleSpecificData.allergies
                }
            });
        } else if (role === 'ADMIN') {
            profile = await prisma.admin.create({
                data: {
                    userId: user.id,
                    adminLevel: roleSpecificData.adminLevel || 'STAFF',
                    permissions: roleSpecificData.permissions || [],
                    department: roleSpecificData.department
                }
            });
        }
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(201).json({
            message:"User created successfully",
            data: {
                user: userWithoutPassword,
                profile
            }
        })
    }catch(error){
        console.error('Prisma error:', error);
        res.status(500).json({
            message:"Error creating user",
            error: {
                name: error.name,
                message: error.message,
                clientVersion: error.clientVersion
            }
        })
    }
}

export const loginUser = async (req, res) => {
    const {identifier,password} = req.body

    try{
        const user = await prisma.user.findFirst({
            where:{
                OR:[
                    {emailAddress:identifier},
                    {userName:identifier}
                ]
            }
        })
        if(!user){
            return res.status(401).json({
                message:"Invalid credentials"
            })
        }
        const isPasswordValid = await bcrypt.compare(password,user.password)//Compare the entered password with the hashed passwords
        if(!isPasswordValid){
            return res.status(401).json({
                message:"Incorrect password. Try again"
            })
        }
        const payload = {
            userId:user.id,
            emailAddress:user.emailAddress,
            userName:user.userName,
            firstName:user.firstName,
            lastName:user.lastName,
            address:user.address,
            city:user.city,
            state:user.state,
            phoneNumber:user.phoneNumber,
            dateOfBirth:user.dateOfBirth,
            role:user.role

        }
        const token = jwt.sign(payload,process.env.JWT_SECRET_KEY,{expiresIn:'1h'})

        // Set cookie (optional, for web apps)
        res.cookie('token',token,{httpOnly:true,secure:false,maxAge:3600000})
        
        // Return token in response (required for mobile/API clients)
        res.status(200).json({
            message:"Login successful",
            data:{
                user:{
                    id:user.id,
                    emailAddress:user.emailAddress,
                    userName:user.userName,
                    role:user.role
                },
                token: token 
            }
        })
    }catch(error){
        res.status(500).json({
            message:"Error logging in",
            error
        })
    }
}


export const getUserProfile = async (req, res) => {
  const userId = req.user.id;
  

  try {
    // Fetch the user with both possible role relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        dentist: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only keep relevant role-specific data
    let roleData = {};
    if (user.role === "PATIENT") {
      roleData = user.patient;
    } else if (user.role === "DENTIST") {
      roleData = user.dentist;
    }

    
    const userProfile = {
      ...user,
      roleData, 
    };

    // Optionally remove raw `patient` and `dentist` fields
    delete userProfile.patient;
    delete userProfile.dentist;

    res.status(200).json({
      message: "User profile retrieved successfully",
      data: userProfile,
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({
      message: "Error retrieving user profile",
      error,
    });
  }
};




export const updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    firstName,
    lastName,
    address,
    city,
    state,
    phoneNumber,
    roleData // role-specific fields from frontend
  } = req.body;

  try {
    // First fetch user role
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update base user fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        address,
        city,
        state,
        phoneNumber,
        ...(roleData &&
          existingUser.role === "PATIENT" && {
            patient: { update: roleData }
          }),
        ...(roleData &&
          existingUser.role === "DENTIST" && {
            dentist: { update: roleData }
          })
      },
      include: {
        patient: true,
        dentist: true
      }
    });

    res.status(200).json({
      message: "User profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      message: "Error updating user profile",
      error
    });
  }
};


export const deleteUser = async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        await prisma.user.delete({
            where: { id: userId }
        });

        res.status(200).json({
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting user",
            error
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();

        res.status(200).json({
            message: "Users retrieved successfully",
            data: users
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving users",
            error
        });
    }
};

export const changePassword = async (req, res) => {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        res.status(200).json({
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error changing password",
            error
        });
    }
};

export const resetPassword = async (req, res) => {
    const { emailAddress, newPassword } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { emailAddress }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { emailAddress },
            data: { password: hashedNewPassword }
        });

        res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error resetting password",
            error
        });
    }
};

export const getAllDentists = async (req, res) => {
    try {
        const dentists = await prisma.dentist.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        emailAddress: true,
                        userName: true,
                        address: true,
                        city: true,
                        state: true,
                        phoneNumber: true,
                        dateOfBirth: true
                    }
                }
            }
        });

        res.status(200).json({
            message: "Dentists retrieved successfully",
            data: dentists
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving dentists",
            error
        });
    }
}

export const getDentistById = async (req, res) => {
    const userId = req.params.userId;

  try {
    const dentist = await prisma.dentist.findFirst({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!dentist || dentist.user.role !== "DENTIST") {
      return res.status(404).json({ message: "Dentist not found" });
    }

    res.status(200).json({
      message: "Dentist retrieved successfully",
      data: dentist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving dentist",
      error: error.message,
    });
  }
};
