import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import axios from './api/axios';

export default function Join() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birth, setBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password || !passwordConfirm || !name || !nickname || !birth || !phone || !gender) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert("입력 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await axios.post('/api/users/register', {
        userEmail: email,
        password: password,
        userName: name,
        nickname: nickname,
        userBirth: parseInt(birth, 10), //숫자로 변환
        userGender: gender,
        userPhone: phone,
      });

      Alert.alert('회원가입 성공!', '로그인 페이지로 이동합니다.');
      router.replace('/login');

    } catch (error) {
      const errorMessage = error.response?.data?.error || '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.';
      Alert.alert('회원가입 실패', errorMessage);
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>회원가입</Text>

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
        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
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
          placeholder="생년월일 8자리 (예: 19991231)"
          value={birth}
          onChangeText={setBirth}
          keyboardType="number-pad"
          maxLength={8}
        />
        <TextInput
          style={styles.input}
          placeholder="휴대전화번호 (예: 01012345678)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'M' && styles.genderButtonSelected]}
            onPress={() => setGender('M')}
          >
            <Text style={[styles.genderButtonText, gender === 'M' && styles.genderButtonTextSelected]}>남자</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'F' && styles.genderButtonSelected]}
            onPress={() => setGender('F')}
          >
            <Text style={[styles.genderButtonText, gender === 'F' && styles.genderButtonTextSelected]}>여자</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/login')}>
          <Text style={styles.linkButtonText}>이미 계정이 있으신가요? 로그인</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
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
  }
  
});
