import { useUserStore } from '@/app/store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import Dashboard from './dashboard';
import MainPage from './mainpage';

export default function Index() {
  const role = useUserStore(state => state.role);
const setRole = useUserStore(state => state.setRole);

  useEffect(() => {
    const loadRoleFromStorage = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('role');
        if (storedRole) {
          setRole(storedRole);
        }
      } catch (e) {
        console.error('Failed to load role from storage', e);
      }
    };

    loadRoleFromStorage();
  }, []);
  if (role === 'ADMIN') {
    return <Dashboard />;
  }
  return <MainPage />;
}
