import axios from 'axios';
import pkg from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const getTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export const initiateSTKPush = async (req, res) => {
  const amount = req.body.amount;
  const phone = req.body.phoneNumber; 

  const shortCode = process.env.SHORTCODE; 
  const passKey = process.env.PASSKEY;
  const timestamp = getTimestamp();

  const password = Buffer.from(shortCode + passKey + timestamp).toString('base64');
  const formattedPhone = phone.startsWith('0')
    ? `254${phone.substring(1)}`
    : phone; 

  try {
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: 'Dentalink',
        TransactionDesc: 'Dentalink payment',
      },
      {
        headers: {
          Authorization: `Bearer ${req.accessToken}`, 
        },
      }
    );

    res.status(200).json({
      message: 'Payment initiated successfully',
      response: response.data, 
    });
  } catch (error) {   
    res.status(500).json({
      message: 'Error initiating payment',
      error: error.response?.data || error.message,
    });
  }
};


export const handleSTKPushCallback = (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;
    
    if (!callbackData) {
      console.error('No callback data received');
      return res.status(400).json({
        message: 'No callback data received'
      });
    }

  
    console.log('STK Push Callback Data:', {
      MerchantRequestID: callbackData.MerchantRequestID,
      CheckoutRequestID: callbackData.CheckoutRequestID,
      ResultCode: callbackData.ResultCode,
      ResultDesc: callbackData.ResultDesc
    });

    
    const isSuccessful = callbackData.ResultCode === 0;

    if (isSuccessful) {
      const paymentDetails = callbackData.CallbackMetadata.Item.reduce((acc, item) => {
        acc[item.Name] = item.Value;
        return acc;
      }, {});

      console.log('Payment Details:', paymentDetails);

      return res.status(200).json({
        message: 'Payment processed successfully',
        success: true,
        data: paymentDetails
      });
    } else {
      console.error(`Payment failed: ${callbackData.ResultDesc}`);
      return res.status(200).json({
        message: callbackData.ResultDesc,
        success: false
      });
    }

  } catch (error) {
    console.error('Error processing callback:', error);
    return res.status(500).json({
      message: 'Error processing payment callback',
      error: error.message
    });
  }
};