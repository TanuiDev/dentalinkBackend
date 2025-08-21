import {getAccessToken} from "../middlewares/AccessToken.js"
import {Router} from "express";
import {initiateSTKPush, handleSTKPushCallback} from "../controllers/mpesaStkPushContoller.js"


export const mpesaStkPushRouter = Router();


mpesaStkPushRouter.route('/initiate')
.post(getAccessToken, initiateSTKPush);

mpesaStkPushRouter.route('/callback')
.post(handleSTKPushCallback);

