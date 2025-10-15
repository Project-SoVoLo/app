import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from '../../api/axios';

export default function NoticeDetail() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [role, setRole] = useState('');
  const [optionsVisible, setOptionsVisible] = useState(false);

  //수정 관련 상태
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 좋아요 상태
  const [liked, setLiked] = useState(notice?.liked ?? false);
  const [likeCount, setLikeCount] = useState(notice?.likeCount ?? 0);

  useEffect(() => {
  if (notice) {
    setLiked(Boolean(notice.liked));
    setLikeCount(notice.likeCount || 0);
  }
}, [notice]);


  // 좋아요 토글 함수
  const handleLike = async () => {
  try {
    const res = await axios.post(
      `/api/notice/${postId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          noticeId: postId,
        },
      }
    );
    // 서버 응답에 좋아요 상태와 카운트를 정확히 담아서 보내도록 백엔드 수정 필요
    if (res.data) {
      setLiked(Boolean(res.data.liked));
      setLikeCount(res.data.likeCount);
    }
    
  } catch (e) {
    Alert.alert('오류', e.response?.data?.message || '좋아요 처리 실패');
  }
};

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
    AsyncStorage.getItem('role').then(r => setRole(r || ''));
  }, []);

  useEffect(() => {
    if (!postId) return;

    if(!authToken){
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      router.replace('/login');
      return;
    }
    setLoading(true);
    axios.get(`/api/notice/${postId}`)
      .then(res => {
        // console.log("Received notice ", res.data); //liked 수신 상태 확인용
        setNotice(res.data)})
      .catch(() => Alert.alert('오류', '공지사항 상세를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [postId]);


  const isAdmin = (role ?? '').toLowerCase() === 'admin';

  const openEditModal = () => {
    setEditTitle(notice?.title);
    setEditContent(notice?.content);
    setEditModalVisible(true);
    setOptionsVisible(false);
  };

  //공지사항 수정
  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력하세요.');
      return;
    }
    try {
      await axios.patch(
        `/api/notice/${postId}`,
        { title: editTitle, content: editContent },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setNotice(prev => prev ? ({ ...prev, title: editTitle, content: editContent }) : prev);
      setEditModalVisible(false);
      Alert.alert('수정 완료', '공지사항이 수정되었습니다.');
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '수정 실패');
    }
  };

  //공지사항 삭제
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/notice/${postId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      Alert.alert('삭제 완료', '공지사항이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.replace('/noticelist') }
      ]);
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '삭제 실패');
    }
    setOptionsVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  if (!notice) {
    return (
      <View style={styles.container}>
        <Text>공지사항이 존재하지 않습니다.</Text>
        <Button title="뒤로가기" onPress={() => router.replace('/(tabs)/(Community)/community')} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {isAdmin && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setOptionsVisible(true)}>
            <MaterialIcons name="more-vert" size={26} color="#444" />
          </TouchableOpacity>
        </View>
      )}
      {/* 좋아요 버튼 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={handleLike}>
          <MaterialIcons
            name={liked ? 'favorite' : 'favorite-border'}
            size={28}
            color={liked ? '#e0245e' : '#888'} 동기화 수정필요
          />
        </TouchableOpacity>
        <Text style={{ marginLeft: 6, fontSize: 16 }}>{likeCount}</Text>
      </View>

      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.date}>{notice.date}</Text>
      <Text style={styles.content}>{notice.content}</Text>
      <Button title="뒤로가기" onPress={() => router.replace('/(tabs)/(Community)/community')} />

      {/* 옵션 메뉴 모달 */}
      <Modal
        visible={optionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPressOut={() => setOptionsVisible(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity style={styles.optionItem} onPress={openEditModal}>
              <MaterialIcons name="edit" size={21} color="#222" />
              <Text style={styles.optionText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
              <MaterialIcons name="delete" size={21} color="#b44" />
              <Text style={styles.optionText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 수정 모달 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModal}>
            <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>공지사항 수정</Text>
            <TextInput
              placeholder="제목"
              value={editTitle}
              onChangeText={setEditTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="내용"
              value={editContent}
              onChangeText={setEditContent}
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalButton}>
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEdit} style={[styles.modalButton, { marginLeft: 16 }]}>
                <Text style={{ color: '#007bff' }}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12 },

  date: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 20 
  },

  content: { 
    fontSize: 16, 
    lineHeight: 22 
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionsModal: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingVertical: 8,
    minWidth: 110,
    marginTop: 30,
    marginRight: 24,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  optionText: {
    fontSize: 15,
    marginLeft: 10,
    color: '#222',
  },

  editModal: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    width: 300,
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

  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  }

});
