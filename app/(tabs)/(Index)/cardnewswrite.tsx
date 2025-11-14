import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from '../../api/axios';

export default function CardNewsWrite() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState(null); // 파일 객체
  const [adminId, setAdminId] = useState('');
  const [imageAssets, setImageAssets] = useState([]); // 파일 배열
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
    AsyncStorage.getItem('userEmail').then(email => setAdminId(email || ''));
  }, []);

  // 썸네일 이미지 선택
  const pickThumbnail = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: false,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setThumbnail(res.assets[0]);
    }
  };

  // 카드뉴스 이미지 다중 선택
  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      base64: false,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImageAssets(res.assets);
    }
  };

  const handleSubmit = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 가능합니다.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 오류', '제목, 내용을 모두 입력하세요.');
      return;
    }
    if (!thumbnail) {
      Alert.alert('입력 오류', '썸네일 이미지를 첨부하세요.');
      return;
    }
    if (!imageAssets || imageAssets.length === 0) {
      Alert.alert('입력 오류', '카드뉴스 이미지를 첨부하세요.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('adminId', adminId);
      formData.append('title', title);
      formData.append('content', content);

      // 썸네일 이미지 파일 첨부
      const thumbParts = thumbnail.uri.split('.');
      const thumbType = thumbParts[thumbParts.length - 1].toLowerCase();
      formData.append('thumbnail', {
        uri: thumbnail.uri,
        name: `thumb.${thumbType}`,
        type: `image/${thumbType === 'jpg' ? 'jpeg' : thumbType}`,
      });

      // 카드뉴스 이미지 여러 장 첨부
      imageAssets.forEach((img, idx) => {
        const uriParts = img.uri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        formData.append('images', {
          uri: img.uri,
          name: `card${idx + 1}.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });
      });

      // 서버에서 업로드 완료 후, 실제 S3 URL을 DB에 저장해줌 (카드뉴스 생성 API)
      const res = await axios.post(
        '/api/card',
        formData,
        { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data' } }
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
    <ScrollView style={styles.container}>
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
      
      {/* 썸네일 */}
      <Text style={{marginBottom:8}}>썸네일 이미지</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        {thumbnail && (
          <Image source={{ uri: thumbnail.uri }} style={{ width: 80, height: 62, borderRadius: 8, marginRight: 10 }} />
        )}
        <Button title="썸네일 선택" onPress={pickThumbnail} disabled={loading} />
      </View>
      
      {/* 카드뉴스 이미지 다중 선택 */}
      <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>카드뉴스 이미지</Text>
      <ScrollView horizontal style={{ marginBottom: 12 }}>
        {imageAssets.map((img, idx) => (
          <Image key={idx} source={{ uri: img.uri }} style={{ width: 90, height: 62, borderRadius: 8, marginRight: 10 }} />
        ))}
      </ScrollView>
      <Button title="이미지 선택" onPress={pickImages} disabled={loading} />

      <Button title="등록하기" onPress={handleSubmit} disabled={loading || !authToken} />
      <Button title="취소" onPress={() => router.back()} color="#777" />
      {!authToken && <Text style={{ color: 'red', marginTop: 10 }}>로그인 후 작성할 수 있습니다.</Text>}
    </ScrollView>
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
