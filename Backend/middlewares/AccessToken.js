import axios from "axios";  

export const getAccessToken = async (req, res, next) => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    req.accessToken = response.data.access_token;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error generating access token",
      error: error.message,
    });
  }
};
