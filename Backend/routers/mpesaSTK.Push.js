import {getAccessToken} from "../middlewares/AccessToken.js"
import {Router} from "express";
import {initiateSTKPush, handleSTKPushCallback, getPaymentStatus} from "../controllers/mpesaStkPushContoller.js"


export const mpesaStkPushRouter = Router();


mpesaStkPushRouter.route('/initiate')
.post(getAccessToken, initiateSTKPush);

mpesaStkPushRouter.route('/callback')
.post(handleSTKPushCallback);

mpesaStkPushRouter.route('/status')
.get(getPaymentStatus);

