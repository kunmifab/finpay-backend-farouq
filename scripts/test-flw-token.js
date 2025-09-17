require('dotenv').config();
const axios = require('axios');
const { URLSearchParams } = require('url');

(async () => {
  const form = new URLSearchParams({
    client_id: process.env.FLW_CLIENT_ID,
    client_secret: process.env.FLW_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const r = await axios.post(
    'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token',
    form.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  console.log('OK token response keys:', Object.keys(r.data));
})();
