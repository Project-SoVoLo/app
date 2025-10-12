import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import axios from './api/axios';

// 환경 변수 가져오기 (app.json extra)
const KAKAO_REST_API_KEY = Constants.expoConfig?.extra?.KAKAO_REST_API_KEY;
const REDIRECT_URI = makeRedirectUri({ useProxy: false }); //Expo 내부에서는 카카오 로그인이 안됨. : Redirect URI 설정 불가
// console.log('Redirect URI:', REDIRECT_URI);



// AuthRequest 파라미터(카카오 OAuth)
const discovery = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // expo-auth-session 공식 OAuth 훅 방식
  const [request, response, promptAsync] = useAuthRequest({
    clientId: KAKAO_REST_API_KEY,
    redirectUri: REDIRECT_URI,
    responseType: 'code',
    scopes: [],
  }, discovery);

  // 카카오 로그인 OAuth 응답 후 처리
  useEffect(() => {
    if (response?.type === 'success' && response.params?.code) {
      const code = response.params.code;
      (async () => {
        try {
          const tokenResponse = await axios.post('/api/oauth/kakao/token', {
            code,
            redirect_uri: REDIRECT_URI,
          });
          const { token, userEmail, nextStep } = tokenResponse.data;
          if (token) {
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('userEmail', userEmail);
            DeviceEventEmitter.emit('loginStateChange');
            router.replace(nextStep || '/');
            Alert.alert('카카오 로그인 성공!');
          } else {
            Alert.alert('로그인 실패', '토큰이 없습니다.');
          }
        } catch (error) {
          console.error('카카오 로그인 오류:', error);
          Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
        }
      })();
    } else if (response?.type === 'dismiss') {
      Alert.alert('로그인 취소', '카카오 로그인 창이 닫혔습니다.');
    }
  }, [response]);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    try {
      const loginApiPath = isAdminLogin ? '/api/admins/login' : '/api/users/login';
      const response = await axios.post(loginApiPath, {
        userEmail: email,
        password: password,
      });

      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('role',response.data.role);
      // console.log(response.data);
      // console.log(response.data.role);
      console.log(response.data.token);

      //nickname 별도 저장(커뮤니티용)
      const profileRes = await axios.get('/api/mypage/profile', {
        headers: {
          Authorization: `Bearer ${response.data.token}`
        }
      });
      if (profileRes.data.nickname) {
        await AsyncStorage.setItem('nickname', profileRes.data.nickname);
      }


      Alert.alert('로그인 성공!', '메인 페이지로 이동합니다.');
      DeviceEventEmitter.emit('loginStateChange');
      router.replace('/');
    } catch (error) {
      // console.error("로그인 실패:", error.response ? error.response.data : error.message);
      Alert.alert('로그인 실패', '이메일과 비밀번호를 확인해 주세요.');
    }
  };
  

  return (
      <View style={styles.loginContainer}>
        <Text style={styles.title}>로그인</Text>

        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsAdminLogin(!isAdminLogin)}
        >
          <View style={[styles.checkbox, isAdminLogin && styles.checkedBox]}>
            {isAdminLogin && <MaterialIcons name="check" size={20} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>관리자 로그인</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FECB00', marginTop: 10, marginBottom: 10 }]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={[styles.buttonText, { color: '#3C1E1E' }]}>카카오 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.replace('/join')}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({

  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },

  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    width: '100%',
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

  checkboxContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkedBox: {
    backgroundColor: '#007bff',
  },

  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },

});
