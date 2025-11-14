import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';

const instance = axios.create({
  baseURL: 'http://54.180.142.67:8080',
  headers: {
    'Content-Type': 'application/json',
  }
});

instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 || error.response?.data?.status === 'EXPIRED') {
      DeviceEventEmitter.emit('logoutEvent');
    }
    return Promise.reject(error);
  }
);


export default instance;
