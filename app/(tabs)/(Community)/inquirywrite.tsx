import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from '../../api/axios';

export default function InquiryWrite() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
    AsyncStorage.getItem('userEmail').then(email=>setEmail(email))
  }, []);

  const handleSubmit = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 가능합니다.');
      return;
    }
    if (!title.trim() || !content.trim() || !password) {
      Alert.alert('입력 오류', '제목, 내용, 비밀번호를 모두 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/inquiry',
        { title, content, password },
        { headers: { Authorization: `Bearer ${authToken}` , 
        'X-User-Id': email} }
      );
      Alert.alert('등록 완료', '건의사항이 등록되었습니다.', [
        { text: '확인', onPress: () => router.replace('/inquirylist') }
      ]);
    } catch (e) {
      if (e.response) {
        Alert.alert('오류', e.response.data.message || '등록 실패');
      } else {
        Alert.alert('오류', '등록 중 네트워크 오류');
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>건의사항 작성</Text>
      <TextInput
        style={styles.input}
        placeholder="제목"
        value={title}
        onChangeText={setTitle}
        editable={!loading}
      />
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        placeholder="내용"
        value={content}
        onChangeText={setContent}
        multiline
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 (숫자 또는 문자, 글 열람/삭제시 필요)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <Button title="등록하기" onPress={handleSubmit} disabled={loading || !authToken} />
      <Button title="취소" onPress={() => router.back()} color="#777" />
      {!authToken && <Text style={{ color: 'red', marginTop: 10 }}>로그인 후 작성할 수 있습니다.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 24,
  },

  input: {
    backgroundColor: "#f4f6fb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    color: "#34495e",
    shadowColor: "#b0c4de",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

});
