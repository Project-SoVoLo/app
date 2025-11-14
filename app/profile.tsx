import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUserStore } from './store/userStore';

export default function ProfileScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchUserEmail = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      const role = await AsyncStorage.getItem('role');
      if (email) {
        setUserEmail(email);
      }
      if(role){
        setRole(role);
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
  const logoutListener = DeviceEventEmitter.addListener('logoutEvent', handleLogout);
  return () => logoutListener.remove();
}, []);

  //로그아웃
const handleLogout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('userEmail');
  await AsyncStorage.removeItem('role');
  await AsyncStorage.removeItem('nickname');
  await AsyncStorage.removeItem('processedAuthCodes'); //인가 코드 기록도 삭제
  useUserStore.getState().clearRole();

  // DeviceEventEmitter.emit('logoutEvent');

  Alert.alert('로그아웃', '성공적으로 로그아웃되었습니다.');
  DeviceEventEmitter.emit('loginStateChange');

  router.replace('/');
};


  
  // AsyncStorage 확인
  // useEffect(() => {
  //   const printAllStorage = async () => {
  //     try {
  //       const keys = await AsyncStorage.getAllKeys();
  //       if (keys.length === 0) {
  //         console.log('AsyncStorage: null');
  //         return;
  //       }
  //       const items = await AsyncStorage.multiGet(keys);
  //       items.forEach(([key, value]) => {
  //         console.log(`${key}: ${value !== null ? value : 'null'}`);
  //       });
  //     } catch (e) {
  //       console.error('AsyncStorage 오류:', e);
  //     }
  //   };
  
  //   printAllStorage();
  // }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>프로필</Text>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>이메일</Text>
          <Text style={styles.infoText}>{userEmail || '정보 없음'}</Text>
        </View>
      {role!='ADMIN' &&( //관리자일 경우 로그아웃만 표시
        <>
        <TouchableOpacity style={styles.Button} onPress={()=>router.replace('/mypage/account')}>
          <Text style={styles.ButtonText}>계정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.Button} onPress={()=>router.replace('/mypage/passwordconfirm')}>
          <Text style={styles.ButtonText}>개인정보 수정</Text>
        </TouchableOpacity>

        
        <TouchableOpacity style={styles.Button} onPress={()=>router.replace('/mypage/consulation')}>
          <Text style={styles.ButtonText}>상담 내역</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.Button} onPress={()=>router.replace('/mypage/selftest')}>
          <Text style={styles.ButtonText}>자가 진단 내역</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.Button} onPress={()=>router.replace('/mypage/condition')}>
          <Text style={styles.ButtonText}>호전 상태</Text>
        </TouchableOpacity>
        </>
      )}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 36,
    color: '#2c3e50',
  },

  infoBox: {
    marginBottom: 24,
  },

  infoLabel: {
    fontSize: 16,
    color: '#7f8a9a',
    fontWeight: '600',
  },

  infoText: {
    fontSize: 20,
    marginTop: 8,
    color: '#34495e',
    fontWeight: '500',
  },

  Button: {
    marginTop: 22,
    backgroundColor: '#f4f6fb',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#a3c4f3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  ButtonText: {
    color: '#2c3e50',
    fontSize: 18,
    fontWeight: '700',
  },

  logoutButton: {
    marginTop: 36,
    backgroundColor: '#d33f49',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#9d2a2f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  logoutButtonText: {
    color: '#f7f9fc',
    fontSize: 18,
    fontWeight: '700',
  },

  backButton: {
    marginBottom: 20,
  },

  backButtonText: {
    fontSize: 17,
    color: '#2c3e50',
    fontWeight: '600',
  },
});
