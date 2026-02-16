import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { showToast } from '../stores';

// let telegramRawData = '';
let isLoginComplete = false;
let accessToken = '';

export const setTelegramRawData = (_data: string) => {
  // telegramRawData = data;
};

export const setLoginComplete = (value: boolean) => {
  isLoginComplete = value;
};

export const setAccessToken = (token: string) => {
  accessToken = token;
};

const requestInterceptor = (request: InternalAxiosRequestConfig) => {
  // if (telegramRawData) {
  //   request.headers['telegramRawData'] = telegramRawData;
  // }

  if (accessToken) {
    request.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (!isLoginComplete && !request.url?.includes('/auth/tma')) {
    return Promise.reject(new Error('Login not complete'));
  }

  return request;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(requestInterceptor, (error) => {
  throw error;
});

const getErrorMessage = (error: AxiosError<{ message?: string }>) => {
  const data = error.response?.data;
  if (data?.message) return data.message;

  const status = error.response?.status ?? 0;
  if (status >= 500) return 'Server error. Please try again later.';
  if (status === 404) return 'Not found.';
  if (status === 403) return 'Access denied.';
  if (status === 401) return 'Unauthorized. Please re-login.';
  return 'Something went wrong.';
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response && error.response.status >= 400) {
      showToast(getErrorMessage(error));
    }
    return Promise.reject(error);
  },
);
