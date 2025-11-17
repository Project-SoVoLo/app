import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';

const instance = axios.create({
  baseURL: 'http://13.125.43.47:8080',
  headers: {
    'Content-Type': 'application/json',
  }
});

// const instance = axios.create({
//   baseURL: 'http://192.168.0.102:8080',
//   headers: {
//     'Content-Type': 'application/json',
//   }
// });

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
