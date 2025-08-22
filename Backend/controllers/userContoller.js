import pkg from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const createUser = async (req, res) => {
    const {firstName,lastName,emailAddress,userName,password,address,city,state,phoneNumber,dateOfBirth,role, ...roleSpecificData} = req.body

    const hashedPassword = await bcrypt.hash(password,10)

    try{
        // user details
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
        const user = await prisma.user.findUnique({
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