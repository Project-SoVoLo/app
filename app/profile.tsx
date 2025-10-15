import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  //로그아웃
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('role');
    await AsyncStorage.removeItem('nickname');
    
    
    Alert.alert("로그아웃", "성공적으로 로그아웃되었습니다.");
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
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },

  infoBox: {
    marginBottom: 20,
  },

  infoLabel: {
    fontSize: 16,
    color: '#888',
  },

  infoText: {
    fontSize: 20,
    marginTop: 4,
  },

  Button: {
    marginTop: 20,
    backgroundColor: '#f2f2f2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },

  ButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },

  logoutButton: {
    marginTop: 30,
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },

  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  backButton: {
        marginBottom: 16,
  },

        
  backButtonText: {
      fontSize: 16,
      color: "#000",
  }

});
