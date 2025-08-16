export const AllfieldsRequired = (req, res, next) => {
    const {firstName,lastName,emailAddress,userName,password,address,city,state,phoneNumber,dateOfBirth,role, ...roleSpecificData} = req.body
    
    // Basic fields required for all users
    if (!firstName || !lastName || !emailAddress || !userName || !password || !address || !phoneNumber || !dateOfBirth || !city || !state) {
        return res.status(400).json({
            message: "All basic fields are required",
        });
    }
    
    // Role-specific required fields
    if (role === 'DENTIST') {
        if (!roleSpecificData.dentistId || !roleSpecificData.specialization || !roleSpecificData.education || !roleSpecificData.experience || !roleSpecificData.hourlyRate) {
            return res.status(400).json({
                message: "Dentist requires: dentistId, specialization, education, experience, and hourlyRate",
            });
        }
    } else if (role === 'PATIENT') {
        // Patient fields are optional, so no additional validation needed
    } else if (role === 'ADMIN') {
        // Admin fields are optional, so no additional validation needed
    }
    
    next();
}
