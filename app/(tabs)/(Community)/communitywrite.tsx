import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from '../../api/axios';

export default function CommunityWrite() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authToken, setAuthToken] = useState(null);
  const [imageAsset, setImageAsset] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
  }, []);

  //이미지 선택 및 미리보기
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '이미지 접근 권한을 허용해 주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageAsset(result.assets[0]);
    }
  };

  //게시글 등록 요청
  const handleSubmit = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 작성 가능합니다.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      Alert.alert('입력 오류', '제목과 본문을 모두 입력하세요.');
      return;
    }

    try {
      const blocks = [
        { type: 'text', content: body },
        ...(imageAsset ? [{ type: 'image', url: imageAsset.uri, alt: '첨부 이미지' }] : [])
      ];

      const res = await axios.post(
        '/api/community-posts',
        { title, blocks },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      Alert.alert('글 등록 완료', '커뮤니티 글이 등록되었습니다.', [
        { text: '확인', onPress: () => router.replace('/communitylist') }
      ]);
    } catch (e) {
      if (e.response) {
        Alert.alert('오류', e.response.data.message || '등록 실패');
      } else {
        Alert.alert('오류', '등록 중 네트워크 오류');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>커뮤니티 글 작성</Text>
      <TextInput
        style={styles.input}
        placeholder="제목"
        value={title}
        onChangeText={setTitle}
        editable={!!authToken}
      />
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        placeholder="내용"
        value={body}
        onChangeText={setBody}
        multiline
        editable={!!authToken}
      />

      {/* 이미지 업로드/미리보기 */}
      <View style={{ marginBottom: 18, alignItems: 'center' }}>
        {imageAsset &&
          <Image source={{ uri: imageAsset.uri }} style={{ width: 160, height: 110, borderRadius: 8, marginBottom: 10 }} />
        }
        <Button title="이미지 선택" onPress={pickImage} />
      </View>

      <Button title="등록하기" onPress={handleSubmit} disabled={!authToken} />
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
  },
  
});
