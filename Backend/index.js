import express from "express";

import {usersRouter} from "./routers/UserRouter.js"
import {appointmentRouter} from "./routers/appointmentRouter.js"
import {prescriptionRouter} from "./routers/prescriptionRouter.js"

import cors from 'cors'
import cookieParser from 'cookie-parser';

export const app=express()
app.use(express.json())
app.use(cookieParser())
app.use(cors(
    {
        origin:[
            'http://localhost:5173',
            'http://localhost:5174',
        ],
        methods:['GET','POST','PATCH','DELETE','GET','PUT'],
        credentials:true
    }
))

app.use('/auth',usersRouter)
app.use('/appointments',appointmentRouter)
app.use('/prescriptions',prescriptionRouter)




