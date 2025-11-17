import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from './api/axios';
import { useUserStore } from './store/userStore';

const KAKAO_REST_API_KEY = Constants.expoConfig?.extra?.KAKAO_REST_API_KEY;
const REDIRECT_URI = 'http://13.125.43.47:8080/api/oauth/kakao/callback';
// const REDIRECT_URI = 'http://192.168.0.102:8080/api/oauth/kakao/callback';
const USED_CODES_KEY = 'processedAuthCodes';

const getKakaoAuthUrl = () =>
  `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;

const getUsedCodes = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USED_CODES_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch {
    return [];
  }
};

const addUsedCode = async (code) => {
  const codes = await getUsedCodes();
  if (!codes.includes(code)) {
    codes.push(code);
    await AsyncStorage.setItem(USED_CODES_KEY, JSON.stringify(codes));
    return true;
  }
  return false;
};

const clearUsedCodes = async () => {
  try {
    await AsyncStorage.removeItem(USED_CODES_KEY);
    console.log('usedCodes 초기화 완료');
  } catch (e) {
    console.error('usedCodes 초기화 실패:', e);
  }
};


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showKakaoWebView, setShowKakaoWebView] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  const isProcessingRef = useRef(false); 
  const webViewRef = useRef(null);
  const isAlertShown = useRef(false);

  //로그아웃 이벤트 리스너
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('logoutEvent', () => {
      clearUsedCodes();
      isProcessingRef.current = false;
      setIsProcessing(false);
      console.log('[logoutEvent] 상태 초기화');
    });
    return () => listener.remove();
  }, []);

  const showAlertOnce = (title, message) => {
    if (isAlertShown.current) return;
    isAlertShown.current = true;
    Alert.alert(title, message, [
      {
        text: '확인',
        onPress: () => {
          isAlertShown.current = false;
        },
      },
    ]);
  };

  const tokenRequestCount = useRef(0);
  const tokenStoreCount = useRef(0);

  //인가 코드 처리 로직을 별도의 함수로 분리
  const processKakaoCode = useCallback(async (code) => {
    //이미 처리 중이거나 코드가 없으면 중단
    if (isProcessingRef.current || !code) {
      console.log('이미 처리 중이거나 유효하지 않은 코드입니다.');
      return;
    }
    
    //처리 시작 플래그 설정
    isProcessingRef.current = true;
    setIsProcessing(true);
    setShowKakaoWebView(false);
    
    console.log('인가 코드 획득 및 처리 시작:', code);

    //토큰 요청 전에 인가 코드 중복 검사 및 저장 시도
    const isNewCode = await addUsedCode(code);
    
    if (!isNewCode) {
      console.log('중복 코드. 무시합니다.');
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }
    
    console.log('신규 코드 저장 완료. 토큰 요청 시작:', code);
    
    tokenRequestCount.current += 1;
    console.log(`[토큰 요청 시도] 횟수: ${tokenRequestCount.current}`);

    try {
      //백엔드 POST 요청(1회만 요청되도록 함)
      const tokenResponse = await axios.post(`/api/oauth/kakao/token?code=${code}`, {
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
      });

      console.log('토큰 응답:', tokenResponse.data);

      const { token, userEmail } = tokenResponse.data;

      tokenStoreCount.current += 1;
      console.log(`[토큰 저장/전송 처리] 횟수: ${tokenStoreCount.current}`);

      if (token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('userEmail', userEmail);
        await AsyncStorage.setItem('role', tokenResponse.data.role);
        DeviceEventEmitter.emit('loginStateChange');

        await router.replace('/');
        Alert.alert('카카오 로그인 성공!');
      } else {
        showAlertOnce('로그인 실패', '토큰이 없습니다.');
      }
    } catch (error) {
      if (error.response) {
        console.error('응답 에러 데이터:', error.response.data);
        console.error('응답 에러 상태:', error.response.status);
      } else {
        console.error('카카오 로그인 오류:', error.message);
      }
      showAlertOnce('로그인 실패', '카카오 로그인 중 오류가 발생했습니다. (CODE: 400)');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      console.log('처리 종료');
    }
  }, []);

  const handleShouldStartLoad = useCallback((navState) => {
    const url = navState.url;

    if (url.startsWith(REDIRECT_URI) && url.includes('code=')) {
      
      if (isProcessingRef.current) {
        console.log('[handleShouldStartLoad] 이미 처리 중. 로드 취소.');
        return false;
      }

      const matched = url.match(/[?&]code=([^&]+)/);
      const code = matched ? decodeURIComponent(matched[1]) : null;

      if (code) {
        console.log('[handleShouldStartLoad] 인가 코드 획득 URL 감지. WebView 로드 취소 후 처리 시작.');
        processKakaoCode(code); 
        return false;
      }
    }

    return true; 
  }, [processKakaoCode]);


  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
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
      await AsyncStorage.setItem('role', response.data.role);

      useUserStore.getState().setRole(response.data.role);

      if (!isAdminLogin) {
        const profileRes = await axios.get('/api/mypage/profile', {
          headers: {
            Authorization: `Bearer ${response.data.token}`,
          },
        });
        if (profileRes.data.nickname) {
          await AsyncStorage.setItem('nickname', profileRes.data.nickname);
        }
      }
      Alert.alert('로그인 성공!', '메인 페이지로 이동합니다.');
      DeviceEventEmitter.emit('loginStateChange');

      if (isAdminLogin) router.replace('/(tabs)/(Index)/dashboard');
      else router.replace('/');
    } catch (error) {
      Alert.alert('로그인 실패', '이메일과 비밀번호를 확인해 주세요.');
    }
  };



  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isProcessing}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.kakaoButton]}
          onPress={() => setShowKakaoWebView(true)}
          disabled={isProcessing}
        >
          <Text style={[styles.buttonText]}>카카오 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.replace('/join')} disabled={isProcessing}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>

        <Modal visible={showKakaoWebView} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <WebView
              ref={webViewRef}
              source={{ uri: getKakaoAuthUrl() }}
              //onNavigationStateChange 대신 onShouldStartLoadWithRequest 사용
              onShouldStartLoadWithRequest={handleShouldStartLoad} 
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
            />
            <TouchableOpacity
              style={{ padding: 16, backgroundColor: '#eee', alignItems: 'center' }}
              onPress={() => setShowKakaoWebView(false)}
              disabled={isProcessing}
            >
              <Text style={{ color: '#007bff', fontWeight: 'bold' }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 36,
    color: '#2c3e50',
  },

  input: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 18,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#f4f6fb',
    shadowColor: '#a3c4f3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },

  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#234892',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },

  buttonText: {
    color: '#f1f2f6',
    fontSize: 19,
    fontWeight: '700',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#c1c7d0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  checkedBox: {
    backgroundColor: '#4a90e2',
  },

  checkboxLabel: {
    marginLeft: 10,
    fontSize: 17,
    color: '#2f3542',
    fontWeight: '600',
  },

  kakaoButton: {
    backgroundColor: '#F7E600',
    marginTop: 12,
    marginBottom: 12,
    shadowColor: '#d2c500',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },

  kakaoButtonText: {
    color: '#3b1e1e',
    fontWeight: '700',
  },

  modalCloseButton: {
    padding: 18,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#dcdde1',
  },

  modalCloseButtonText: {
    color: '#3867d6',
    fontWeight: '700',
    fontSize: 17,
  },
});
