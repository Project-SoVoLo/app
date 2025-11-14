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
    backgroundColor: '#f4f7fb',
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 36,
    color: '#34495e',
  },

  input: {
    width: '100%',
    height: 54,
    borderColor: '#aab2bd',
    borderWidth: 1.3,
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#d6d9e3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },

  genderContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  genderButton: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ced6e0',
    borderWidth: 1.6,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    shadowColor: '#c7cace',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  genderButtonSelected: {
    backgroundColor: '#2980ff',
    borderColor: '#2980ff',
    shadowColor: '#2166cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },

  genderButtonText: {
    fontSize: 17,
    color: '#555d6e',
  },

  genderButtonTextSelected: {
    color: '#f9fafd',
    fontWeight: '700',
  },

  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#2980ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    marginTop: 14,
    shadowColor: '#1e62cc',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.42,
    shadowRadius: 11,
    elevation: 9,
  },

  buttonText: {
    color: '#f9fafd',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },

  linkButton: {
    marginTop: 26,
  },

  linkButtonText: {
    color: '#2980ff',
    fontSize: 17,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
