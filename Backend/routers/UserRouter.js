import {Router} from "express"

import {createUser,loginUser} from "../controllers/userContoller.js"
import {AllfieldsRequired} from "../middlewares/AllfieldsRequired.js"
import {CheckEmailPassword} from "../middlewares/UniqueFileds.js"





export const usersRouter = Router()

usersRouter.route('/register')
.post(AllfieldsRequired,CheckEmailPassword,createUser)

usersRouter.route('/login')
.post(loginUser)
