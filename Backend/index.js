import express from "express";



import {usersRouter} from "./routers/UserRouter.js"
import {appointmentRouter} from "./routers/appointmentRouter.js"
import paymentRouter from "./routers/paymentRouter.js"
import {mpesaStkPushRouter} from "./routers/mpesaSTK.Push.js"
import {prescriptionRouter} from "./routers/prescriptionRouter.js"

import cors from 'cors'
import cookieParser from 'cookie-parser';

export const app=express()
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))




app.use(cors(
    {
        origin:'https://smile-access-hub.vercel.app',
        methods:['GET','POST','PATCH','DELETE','PUT','OPTIONS'],
        credentials:true
    }
))

app.use('/auth',usersRouter)
app.use('/appointments',appointmentRouter)
app.use('/payments',paymentRouter)
app.use('/mpesa',mpesaStkPushRouter)
app.use('/prescriptions',prescriptionRouter)


