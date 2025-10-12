import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        // justifyContent: 'center', 
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        },
    button: {
        height: 50,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    buttonText: {
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
    },
});
