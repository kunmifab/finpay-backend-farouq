// src/utils/flutterwaveClient.js
require('dotenv').config();
const axios = require('axios');
const { URLSearchParams } = require('url');

const FLW_CLIENT_ID = process.env.FLW_CLIENT_ID;
const FLW_CLIENT_SECRET = process.env.FLW_CLIENT_SECRET;

// v4 base URLs: sandbox vs prod
const FLW_BASE_URL =
  process.env.FLW_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.flutterwave.cloud/f4bexperience/'
    : 'https://api.flutterwave.cloud/developersandbox/');

// ---- fail fast if envs are missing ----
function assertEnv() {
  const missing = [];
  if (!FLW_CLIENT_ID) missing.push('FLW_CLIENT_ID');
  if (!FLW_CLIENT_SECRET) missing.push('FLW_CLIENT_SECRET');
  if (missing.length) {
    const msg = `[flutterwaveClient] Missing required env: ${missing.join(', ')}`;
    // Throwing here prevents silent 401s like client_secret=undefined
    throw new Error(msg);
  }
}
assertEnv();

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
  tokenExpiry = Date.now() + (expiresInSec - 60) * 1000; // refresh 60s early
  return accessToken;
}

async function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    await fetchAccessToken();
  }
  return accessToken;
}

// Axios instance for v4 APIs
const flwAxios = axios.create({
  baseURL: FLW_BASE_URL,
  timeout: 20000,
});

// Inject token on every request
flwAxios.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Optional: if a request comes back 401, refresh token once and retry
flwAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // force refresh
      await fetchAccessToken();
      const token = await getAccessToken();
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${token}`;
      return flwAxios(original);
    }
    return Promise.reject(error);
  }
);

module.exports = {
  flwAxios,
};
