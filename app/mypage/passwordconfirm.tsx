import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from '../api/axios';

export default function PasswordConfirm() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedEmail) setEmail(storedEmail);
      else {
        Alert.alert('에러', '로그인 정보가 없습니다. 다시 로그인 해주세요.');
        router.replace('/login');
      }
    };
    loadEmail();
  }, []);

  const handleConfirm = async () => {
    if (!password) {
      Alert.alert('입력 오류', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('/api/users/login', {
        userEmail: email,
        password: password,
      });

      await AsyncStorage.setItem('token', response.data.token);

      router.replace('/mypage/editprofile');
    } catch (error) {
      Alert.alert(
        '비밀번호 확인 실패',
        error.response?.data?.error || '비밀번호가 일치하지 않습니다.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>비밀번호 확인</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('../profile')}>
            <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="비밀번호를 입력하세요"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>확인</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 24,
    paddingTop: 36,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 36,
    color: '#253858',
  },

  backButton: {
    marginBottom: 24,
  },
  
  backButtonText: {
    fontSize: 17,
    color: '#2c3e50',
    fontWeight: '600',
  },

  input: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 20,
    marginBottom: 26,
    fontSize: 16,
    backgroundColor: '#f4f6fb',
    color: '#34495e',
    shadowColor: '#a3c4f3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },

  button: {
    height: 54,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    shadowColor: '#3a72c4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 9,
    elevation: 7,
  },

  buttonText: {
    color: '#f1f2f6',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
