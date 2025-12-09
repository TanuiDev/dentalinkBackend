import axios from "axios";  

export const getAccessToken = async (req, res, next) => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;

  // Validate environment variables
  if (!consumerKey || !consumerSecret) {
    console.error('❌ M-Pesa credentials missing:', {
      hasConsumerKey: !!consumerKey,
      hasConsumerSecret: !!consumerSecret
    });
    return res.status(500).json({
      message: "M-Pesa credentials not configured",
      details: "CONSUMER_KEY or CONSUMER_SECRET missing in environment variables"
    });
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    console.log('🔑 Requesting M-Pesa access token...');
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    req.accessToken = response.data.access_token;
    console.log('✅ Access token generated successfully');
    next();
  } catch (error) {
    console.error('❌ Access token generation failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({
      message: "Error generating access token",
      error: error.response?.data || error.message,
    });
  }
};
