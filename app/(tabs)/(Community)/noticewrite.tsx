import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from '../../api/axios';

export default function NoticeWrite() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
  }, []);

  const handleSubmit = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 가능합니다.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 오류', '제목, 내용을 모두 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/notice',
        { title, content},
        { headers: { Authorization: `Bearer ${authToken}`} }
      );
      Alert.alert('등록 완료', '공지사항이 등록되었습니다.', [
        { text: '확인', onPress: () => router.replace('/noticelist') }
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
      <Text style={styles.title}>공지사항 작성</Text>
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
      <Button title="등록하기" onPress={handleSubmit} disabled={loading || !authToken} />
      <Button title="취소" onPress={() => router.back()} color="#777" />
      {!authToken && <Text style={{ color: 'red', marginTop: 10 }}>로그인 후 작성할 수 있습니다.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff' 
    },

  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 20 
    },

  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 7,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  }

});
