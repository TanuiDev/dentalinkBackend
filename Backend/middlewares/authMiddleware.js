import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; 
        if (!token) {
            return res.status(401).json({
                message: "Access token required"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        //get roles
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                patient: true,
                dentist: true,
                admin: true
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // user info
        req.user = {
            id: user.id,
            email: user.emailAddress,
            role: user.role,
            patientId: user.patient?.id,
            dentistId: user.dentist?.id,
            adminId: user.admin?.id
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

// Middleware to check if user has specific role
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Insufficient permissions"
            });
        }

        next();
    };
};
