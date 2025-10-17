import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from '../../api/axios';

export default function CardNewsWrite() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [adminId, setAdminId] = useState('');
  const [imageUrls, setImageUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
    AsyncStorage.getItem('userEmail').then(email => setAdminId(email || ''));
  }, []);

  const handleImageUrlChange = (idx, value) => {
    // index 번째의 이미지 경로 변화
    setImageUrls(urls =>
      urls.map((url, i) => (i === idx ? value : url))
    );
  };

  const addImageUrlField = () => setImageUrls(urls => [...urls, '']);
  const removeImageUrlField = idx => setImageUrls(urls => urls.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 가능합니다.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 오류', '제목, 내용을 모두 입력하세요.');
      return;
    }
    if (!thumbnailUrl.trim()) {
      Alert.alert('입력 오류', '썸네일 이미지를 입력하세요.');
      return;
    }
    if (imageUrls.some(url => !url.trim())) {
      Alert.alert('입력 오류', '모든 카드뉴스 이미지를 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/card',
        {
          adminId,
          title,
          content,
          thumbnailUrl,
          imageUrls
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      Alert.alert('등록 완료', '카드뉴스가 등록되었습니다.', [
        { text: '확인', onPress: () => router.replace('/cardnewslist') }
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

      <Text style={styles.title}>카드뉴스 작성</Text>
      
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
      
      {/* 이미지 업로드 서버 없어서 테스트용으로 사용, url 입력시 이미지 기입, 불러오기 성공 */}
      <TextInput
        style={styles.input}
        placeholder="썸네일 이미지 경로"
        value={thumbnailUrl}
        onChangeText={setThumbnailUrl}
        editable={!loading}
      />

      <Text style={{ marginBottom: 8, marginLeft: 2, fontWeight: 'bold' }}>카드뉴스 이미지 경로</Text>
      {imageUrls.map((url, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder={`이미지 경로 ${idx + 1}`}
            value={url}
            onChangeText={value => handleImageUrlChange(idx, value)}
            editable={!loading}
          />
          {imageUrls.length > 1 && (
            <Button title="삭제" onPress={() => removeImageUrlField(idx)} color="#d44" />
          )}
        </View>
      ))}
      <Button title="이미지 경로 추가" onPress={addImageUrlField} disabled={loading} />

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
    backgroundColor: '#fff',
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
