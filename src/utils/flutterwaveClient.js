// src/utils/flutterwaveClient.js
// Flutterwave v4 OAuth client + axios instance
// Uses client_credentials to fetch and cache access_token (about 10 mins TTL)

// CommonJS because your app uses require()
const axios = require('axios');
const { URLSearchParams } = require('url');

const FLW_CLIENT_ID = process.env.FLW_CLIENT_ID;
const FLW_CLIENT_SECRET = process.env.FLW_CLIENT_SECRET;

// Sandbox vs Production base URLs for v4
// Docs: https://developer.flutterwave.com/docs/environments
const FLW_BASE_URL =
  process.env.FLW_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.flutterwave.cloud/f4bexperience/'
    : 'https://api.flutterwave.cloud/developersandbox/');

let accessToken = null;
let tokenExpiry = 0; // ms timestamp

async function fetchAccessToken() {
  const tokenUrl =
    'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';

  const form = new URLSearchParams({
    client_id: FLW_CLIENT_ID,
    client_secret: FLW_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const res = await axios.post(tokenUrl, form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });

  const data = res.data; // { access_token, expires_in, token_type, ... }
  accessToken = data.access_token;
  const expiresInSec = Number(data.expires_in || 600);
  // refresh 60s early
  tokenExpiry = Date.now() + (expiresInSec - 60) * 1000;

  return accessToken;
}

async function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    await fetchAccessToken();
  }
  return accessToken;
}

const flwAxios = axios.create({
  baseURL: FLW_BASE_URL,
  timeout: 20000,
});

// Attach Bearer on every request
flwAxios.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
    // v4 headers best practice (optional but recommended):
    // Content-Type set automatically by axios for JSON
    return config;
  },
  (err) => Promise.reject(err)
);

module.exports = {
  flwAxios,
  getAccessToken,
  FLW_BASE_URL,
};
