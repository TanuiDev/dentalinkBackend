import {Router} from "express"

import {createUser,loginUser,getUserProfile,getAllDentists,getAllUsers,deleteUser,updateUserProfile,changePassword,getDentistById} from "../controllers/userContoller.js"
import {AllfieldsRequired} from "../middlewares/AllfieldsRequired.js"
import {CheckEmailPassword} from "../middlewares/UniqueFileds.js"
import { authenticateToken,requireRole } from "../middlewares/authMiddleware.js"





export const usersRouter = Router()

usersRouter.route('/register')
.post(AllfieldsRequired,CheckEmailPassword,createUser)

usersRouter.route('/login')
.post(loginUser)

usersRouter.route('/profile')
.get(getUserProfile)

usersRouter.route('/dentists')
.get(getAllDentists)
usersRouter.route('/dentists/:userId')
.get(getDentistById)


usersRouter.route('/users')
.get(authenticateToken, requireRole(['ADMIN']), getAllUsers);
usersRouter.route('/delete-user/:id')
.delete(deleteUser)
usersRouter.route('/update-profile')
.put(updateUserProfile)
usersRouter.route('/change-password')
.put(changePassword)

