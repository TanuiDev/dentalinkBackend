import {getAccessToken} from "../middlewares/AccessToken.js"
import {Router} from "express";
import {initiateSTKPush} from "../controllers/mpesaStkPushContoller.js"


export const mpesaStkPushRouter = Router();


mpesaStkPushRouter.route('/initiate')
.post(getAccessToken, initiateSTKPush);