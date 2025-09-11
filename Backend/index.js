import express from "express";
// const server = require('http').Server(app)
// const io = require('socket.io')(server)
// const { v4: uuidV4 } = require('uuid')

import {usersRouter} from "./routers/UserRouter.js"
import {appointmentRouter} from "./routers/appointmentRouter.js"
// import {prescriptionRouter} from "./routers/prescriptionRouter.js"

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
        // origin:[
        //     'http://localhost:5173',
        //     'http://localhost:5174',
        // ],
        origin:'*',
        methods:['GET','POST','PATCH','DELETE','GET','PUT'],
        credentials:true
    }
))

app.use('/auth',usersRouter)
app.use('/appointments',appointmentRouter)
app.use('/mpesa',mpesaStkPushRouter)
app.use('/prescriptions',prescriptionRouter)
// app.use('/prescriptions',prescriptionRouter)


//Videochat implementation
// app.get('/videochat', (_req, res) => {
//     res.redirect(`/${uuidV4()}`)
//   })
  
//   app.get('/:room', (req, res) => {
//     res.render('room', { roomId: req.params.room })
//   })
  
//   io.on('connection', socket => {
//     socket.on('join-room', (roomId, userId) => {
//       socket.join(roomId)
//       socket.to(roomId).broadcast.emit('user-connected', userId)
  
//       socket.on('disconnect', () => {
//         socket.to(roomId).broadcast.emit('user-disconnected', userId)
//       })
//     })
//   })

