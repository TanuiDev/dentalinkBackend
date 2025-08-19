import axios from 'axios';

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
    console.error('STK Push Error:', error.response?.data || error.message);

    res.status(500).json({
      message: 'Error initiating payment',
      error: error.response?.data || error.message,
    });
  }
};
