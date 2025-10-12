import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import axios from '../api/axios';

export default function EditProfile() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const [data, setData] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('role');
    
    DeviceEventEmitter.emit('loginStateChange');
  };


  const handleSubmit = async () => {
    if (!email || !password || !name || !nickname || !phone) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post('/api/users/edit-info', {
        newEmail: email,
        newPassword: password,
        userName: name,
        nickname: nickname,
        userPhone: phone,
      },{
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
      Alert.alert('개인정보 변경 성공!', '로그인 페이지로 이동합니다.');
      handleLogout();
      router.replace('/login');

    } catch (error) {
      const errorMessage = error.response?.data?.error || '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.';
      Alert.alert('개인정보 변경 실패', errorMessage);
    }
  };

  useEffect(() => {
    const fetchUserEmail = async () => {
    const email = await AsyncStorage.getItem('userEmail');
    const token = await AsyncStorage.getItem('token');
        if (email) {
            setUserEmail(email);
        }
        if (token){
            setToken(token);
        }
    };
        fetchUserEmail();
    }, []);

    useEffect(() => {
    if (!token) return;

    setLoading(true);
    axios.get('/api/mypage/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        Alert.alert("오류", "계정 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
  if (data) {
    setEmail(data.userEmail || '');
    setName(data.userName || '');
    setNickname(data.nickname || '');
    setPhone(data.userPhone || '');
    }
  }, [data]);


  // useEffect(() => {
  // console.log(data);
  // }, [data]);


  

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>개인정보 변경</Text>

        <TextInput
          style={styles.input}
          placeholder='이메일'
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
        <TextInput
          style={styles.input}
          placeholder="이름"
          value={name}
          onChangeText={setName}
          />
        <TextInput
          style={styles.input}
          placeholder="닉네임"
          value={nickname}
          onChangeText={setNickname}
        />
        <TextInput
          style={styles.input}
          placeholder="휴대전화번호 (예: 01012345678)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>정보 변경</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  container: {
        flex: 1,
        backgroundColor : "#fff",
        paddingHorizontal: 16,
        paddingTop: 20,
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

  genderContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  genderButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },

  genderButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },

  genderButtonText: {
    fontSize: 16,
    color: '#333',
  },

  genderButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },

  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  linkButton: {
    marginTop: 20,
  },

  linkButtonText: {
    color: '#007bff',
    fontSize: 16,
  },

});
