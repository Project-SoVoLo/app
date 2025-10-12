import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from './api/axios';

export default function InquiryDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const [optionsVisible, setOptionsVisible] = useState(false);

  // 삭제 비밀번호 입력 모달 관련 상태
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
    AsyncStorage.getItem('userEmail').then(email => setUserId(email || ''));
    AsyncStorage.getItem('role').then(r => setRole(r || ''));
    }, []);

  const isAdmin = role && role.toLowerCase() === 'admin';
  const isMyPost = inquiry && userId === inquiry.author;
  const canComment = isAdmin || (role && role.toLowerCase() === 'user' && isMyPost);

  //댓글작성
  const handleAddComment = async () => {
    if (!authToken) {
        Alert.alert('로그인 필요', '로그인 후 이용 바랍니다.');
        return;
    }
    if (!commentInput.trim()) return;
    setCommentSubmitting(true);

    //관리자면 userId를 'admin'으로 설정, 아니면 본인 이메일 유지
    const userIdToSend = isAdmin ? 'admin' : userId;

    try {
        const res = await axios.post(
        `/api/inquiry/${id}/comments`,
        { userId: userIdToSend, content: commentInput },
        { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setInquiry({
        ...inquiry,
        comments: [
            ...(inquiry.comments || []),
            { userId: res.data.userId, content: res.data.content, date: res.data.date }
        ]
        });
        setCommentInput('');
    } catch (e) {
        console.log(userId)
        Alert.alert('오류', e.response?.data?.message || '댓글 등록 실패');
    }
    setCommentSubmitting(false);
    };

  // 열람기능
  const handleSubmit = () => {
    if (!password) {
      Alert.alert('오류', '비밀번호를 입력하세요.');
      return;
    }
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 가능합니다.');
      return;
    }
    setLoading(true);
    axios.post(`/api/inquiry/${id}/read`, { password }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(res => {
        if (!isAdmin &&res.data.author !== userId) {
        // console.log(res.data)
        // console.log(userId)
        Alert.alert('권한 오류', '본인의 글만 열람할 수 있습니다.');
        setInquiry(null);
      } else {
        setInquiry(res.data);
        // console.log(res.data)
      }
      })
      .catch(error => {
        console.log('에러:', error);
        if (error.response) {
          console.log('에러 응답 데이터:', error.response.data);
        }
        Alert.alert('오류', '조회 실패 (비밀번호 오류/기타)');
      })
      .finally(() => setLoading(false));
  };

  //삭제 시 비밀번호 요구
  const requestDelete = () => {
    if (!deletePassword) {
        Alert.alert('오류', '삭제할 때 사용할 비밀번호를 입력하세요.');
        return;
    }

    if (!inquiry) {
        Alert.alert('오류', '삭제 대상 글 정보가 없습니다.');
        return;
    }
    
    if (userId !== inquiry.author) {
        Alert.alert('권한 오류', '본인 글이 아니므로 삭제할 수 없습니다.');
        return;
    }
    
    handleDelete(deletePassword);
    };

  //삭제 기능
  const handleDelete = async (passwordToDelete) => {
    try {
      await axios.delete(`/api/inquiry/${id}`, {
    headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
    },
        data :{ password: passwordToDelete },
    });

      Alert.alert('삭제 완료', '건의사항이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.replace('/inquirylist') }
      ]);
    } catch (e) {
      if (e.response) {
        Alert.alert('오류', e.response.data.message || '삭제 실패');
      } else {
        Alert.alert('오류', '네트워크 오류');
      }
    }
    setDeleteModalVisible(false);
    setOptionsVisible(false);
  };

  //열람 전 비밀번호 확인하는 창
  if (!inquiry) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>건의사항 상세 보기</Text>
        <Text>비밀번호 입력 후 상세글을 열람할 수 있습니다.</Text>
        <TextInput
          placeholder="비밀번호"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        {authToken && (
          <Button
            title="열람하기"
            onPress={handleSubmit}
            disabled={loading}
          />
        )}
        {!authToken && (
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.loginText}>로그인 후 이용해주세요.</Text>
          </TouchableOpacity>
        )}
        <Button title="뒤로가기" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setOptionsVisible(true)}>
          <MaterialIcons name="more-vert" size={26} color="#444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{inquiry.title}</Text>
      <Text style={styles.content}>{inquiry.content}</Text>
      {inquiry.comments?.length > 0 && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>댓글</Text>
          {inquiry.comments.map((comment, idx) => (
            <View key={idx} style={styles.commentItem}>
              <Text>{comment.userId}: {comment.content}</Text>
              <Text style={styles.commentDate}>{comment.date}</Text>
            </View>
          ))}
        </View>
      )}

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
            <TouchableOpacity style={styles.optionItem} onPress={() => {
              setOptionsVisible(false);
              setDeleteModalVisible(true);
            }}>
              <MaterialIcons name="delete" size={21} color="#b44" />
              <Text style={styles.optionText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 삭제 비밀번호 입력 모달 */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModal}>
            <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>비밀번호 입력</Text>
            <TextInput
              placeholder="비밀번호"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.modalButton}>
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={requestDelete} style={[styles.modalButton, { marginLeft: 16 }]}>
                <Text style={{ color: 'red' }}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

        {canComment && (
        <View style={styles.commentForm}>
            <TextInput
            style={styles.input}
            placeholder="댓글 입력"
            value={commentInput}
            onChangeText={setCommentInput}
            editable={!commentSubmitting}
            />
            <Button
            title="댓글 등록"
            onPress={handleAddComment}
            disabled={commentSubmitting || !commentInput.trim()}
            />
        </View>
        )}

      <Button title="뒤로가기" onPress={() => router.back()} />
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
    marginBottom: 12 
    },

  content: { 
    fontSize: 16, 
    marginVertical: 12 
    },

  input: { 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 6, 
    padding: 10, 
    marginVertical: 16 
    },

  commentsSection: { 
    marginTop: 24 
    },

  commentsTitle: { 
    fontWeight: '600', 
    marginBottom: 8 
    },

  commentItem: { 
    marginBottom: 8 
    },

  commentDate: { 
    fontSize: 12, 
    color: '#666' 
    },

  loginText: { 
    color: 'red' 
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

  deleteModal: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    width: 300,
  },

  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

});
