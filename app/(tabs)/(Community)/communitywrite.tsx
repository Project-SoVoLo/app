import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from '../../api/axios';

export default function CommunityWrite() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authToken, setAuthToken] = useState(null);
  const [imageAssets, setImageAssets] = useState([]); // 여러 이미지

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
  }, []);

  //이미지 선택 및 미리보기
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '이미지 접근 권한을 허용해 주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5, //최대 선택 가능 이미지
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageAssets(result.assets);
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
      const formData = new FormData();
      formData.append('title', title);

      const blocks = [
        { type: 'text', content: body },
        ...imageAssets.map(() => ({ type: 'image', url: '', alt: '첨부 이미지' }))
      ];
      formData.append('blocks', JSON.stringify(blocks));

      //여러 이미지
      imageAssets.forEach((img, idx) => {
        const uriParts = img.uri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();

        formData.append('images', {
          uri: img.uri,
          name: `photo${idx + 1}.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });
      });

      const res = await axios.post(
        '/api/community-posts',
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          }
        }
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
    <ScrollView style={styles.container}>
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
        <ScrollView horizontal>
          {imageAssets.map((img, idx) => (
            <Image key={idx} source={{ uri: img.uri }} style={{ width: 120, height: 90, borderRadius: 8, marginRight: 10 }} />
          ))}
        </ScrollView>
        <Button title="이미지 선택" onPress={pickImages} />
      </View>

      <Button title="등록하기" onPress={handleSubmit} disabled={!authToken} />
      <Button title="취소" onPress={() => router.back()} color="#777" />
      {!authToken && <Text style={{ color: 'red', marginTop: 10 }}>로그인 후 작성할 수 있습니다.</Text>}
    </ScrollView>
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
