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
    // Save pending payment with initiating user
    try {
      const data = response.data || {};
      await prisma.payment.upsert({
        where: { checkoutRequestId: data.CheckoutRequestID },
        update: {
          merchantRequestId: data.MerchantRequestID,
          resultCode: data.ResponseCode ? Number(data.ResponseCode) : 0,
          resultDesc: data.ResponseDescription || 'Pending',
          amount: String(amount),
          phoneNumber: formattedPhone,
          accountReference: 'Dentalink',
          rawCallback: data,
          status: 'PENDING',
          userId: req.user?.id ?? undefined,
        },
        create: {
          merchantRequestId: data.MerchantRequestID || 'UNKNOWN',
          checkoutRequestId: data.CheckoutRequestID || `PENDING_${Date.now()}`,
          resultCode: data.ResponseCode ? Number(data.ResponseCode) : 0,
          resultDesc: data.ResponseDescription || 'Pending',
          amount: String(amount),
          mpesaReceiptNumber: null,
          transactionDate: null,
          phoneNumber: formattedPhone,
          accountReference: 'Dentalink',
          rawCallback: data,
          status: 'PENDING',
          userId: req.user?.id ?? null,
        },
      });
    } catch (saveErr) {
      console.error('Failed to record pending payment:', saveErr);
    }

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

      const parseTransactionDate = (raw) => {
        if (!raw) return null;
        const str = String(raw);
        if (str.length !== 14) return null;
        const year = Number(str.slice(0, 4));
        const month = Number(str.slice(4, 6)) - 1;
        const day = Number(str.slice(6, 8));
        const hour = Number(str.slice(8, 10));
        const minute = Number(str.slice(10, 12));
        const second = Number(str.slice(12, 14));
        const date = new Date(Date.UTC(year, month, day, hour, minute, second));
        return isNaN(date.getTime()) ? null : date;
      };

      (async () => {
        try {
          const saved = await prisma.payment.upsert({
            where: { checkoutRequestId: callbackData.CheckoutRequestID },
            update: {
              merchantRequestId: callbackData.MerchantRequestID,
              resultCode: callbackData.ResultCode,
              resultDesc: callbackData.ResultDesc,
              amount: paymentDetails.Amount !== undefined ? String(paymentDetails.Amount) : undefined,
              mpesaReceiptNumber: paymentDetails.MpesaReceiptNumber ?? undefined,
              transactionDate: parseTransactionDate(paymentDetails.TransactionDate) ?? undefined,
              phoneNumber: paymentDetails.PhoneNumber ? String(paymentDetails.PhoneNumber) : undefined,
              accountReference: paymentDetails.AccountReference ?? undefined,
              rawCallback: callbackData,
              status: 'SUCCESS',
            },
            create: {
              merchantRequestId: callbackData.MerchantRequestID,
              checkoutRequestId: callbackData.CheckoutRequestID,
              resultCode: callbackData.ResultCode,
              resultDesc: callbackData.ResultDesc,
              amount: String(paymentDetails.Amount ?? 0),
              mpesaReceiptNumber: paymentDetails.MpesaReceiptNumber ?? null,
              transactionDate: parseTransactionDate(paymentDetails.TransactionDate),
              phoneNumber: paymentDetails.PhoneNumber ? String(paymentDetails.PhoneNumber) : null,
              accountReference: paymentDetails.AccountReference ?? null,
              rawCallback: callbackData,
              status: 'SUCCESS',
            },
          });

          return res.status(200).json({
            message: 'Payment processed successfully',
            success: true,
            data: saved,
          });
        } catch (dbError) {
          console.error('Error saving payment:', dbError);
          return res.status(500).json({
            message: 'Error saving payment to database',
            error: dbError.message,
          });
        }
      })();
      return; // ensure we do not continue below while async handler runs
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