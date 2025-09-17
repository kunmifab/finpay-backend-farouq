// src/utils/mapleradClient.js
// Maplerad v4 OAuth client + axios instance

// CommonJS because your app uses require()
const axios = require('axios');
const { URLSearchParams } = require('url');

const MAPLERAD_SECRET_KEY = process.env.MAPLERAD_SECRET_KEY;

// Sandbox vs Production base URLs for v1
// Docs: https://maplerad.dev/docs
const MAPLERAD_BASE_URL =
  process.env.MAPLERAD_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.maplerad.com/v1'
    : 'https://api.maplerad.com/v1');

const mapleradAxios = axios.create({
  baseURL: MAPLERAD_BASE_URL,
  timeout: 20000,
});

// Attach Bearer on every request
mapleradAxios.interceptors.request.use(
  async (config) => {
    config.headers.Authorization = `Bearer ${MAPLERAD_SECRET_KEY}`;
    return config;
  },
  (err) => Promise.reject(err)
);

mapleradAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.data) {
      const data = err.response.data;
      const msg =
        typeof data === 'string'
          ? data
          : data.message || data.error || JSON.stringify(data);
      const wrapped = new Error(`[Maplerad] ${msg}`);
      wrapped.status = err.response.status;
      wrapped.data = data;
      return Promise.reject(wrapped);
    }
    return Promise.reject(err);
  }
);

module.exports = {
  mapleradAxios,
  MAPLERAD_BASE_URL,
};
