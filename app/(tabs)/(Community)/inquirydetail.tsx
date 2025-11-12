import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from '../../api/axios';

export default function InquiryDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const closeOptionsModal = () => setOptionsVisible(false);
  const closeDeleteModal = () => setDeleteModalVisible(false);

  const handleAddComment = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 바랍니다.');
      return;
    }
    if (!commentInput.trim()) return;
    setCommentSubmitting(true);

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
      Alert.alert('오류', e.response?.data?.message || '댓글 등록 실패');
    }
    setCommentSubmitting(false);
  };

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
        if (!isAdmin && res.data.author !== userId) {
          console.log(userId)
          console.log(res.data)
          console.log(res.data.author)
          Alert.alert('권한 오류', '본인의 글만 열람할 수 있습니다.');
          setInquiry(null);
        } else {
          setInquiry(res.data);
        }
      })
      .catch(() => {
        Alert.alert('오류', '조회 실패 (비밀번호 오류/기타)');
      })
      .finally(() => setLoading(false));
  };

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

  const handleDelete = async (passwordToDelete) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/inquiry/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: { password: passwordToDelete },
      });

      Alert.alert('삭제 완료', '건의사항이 삭제되었습니다.', [
        {
          text: '확인', onPress: () => {
            closeDeleteModal();
            closeOptionsModal();
            setTimeout(() => router.replace('/inquirylist'), 300);
          }
        }
      ]);
    } catch (e) {
      if (e.response) {
        Alert.alert('오류', e.response.data.message || '삭제 실패');
      } else {
        Alert.alert('오류', '네트워크 오류');
      }
    }
    setDeleteLoading(false);
  };

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
            title={loading ? '열람중...' : '열람하기'}
            onPress={handleSubmit}
            disabled={loading}
          />
        )}
        {!authToken && (
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.loginText}>로그인 후 이용해주세요.</Text>
          </TouchableOpacity>
        )}
        <Button title="뒤로가기" onPress={() => router.replace('/(tabs)/(Community)/community')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <View style={styles.container}>
        <View style={styles.contentBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setOptionsVisible(true)}>
              <MaterialIcons name="more-vert" size={26} color="#444" />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{inquiry.title}</Text>
          <Text style={styles.content}>{inquiry.content}</Text>

          <View style={styles.sectionBox}>
            {inquiry.comments?.length > 0 && (
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>댓글</Text>
                {inquiry.comments.map((comment, idx) => (
                  <View key={idx} style={styles.commentItem}>
                    <Text style={styles.commentRow}>
                      <Text style={styles.commentUser}>{comment.userId}</Text>
                      <Text>: {comment.content}</Text>
                    </Text>
                    <Text style={styles.commentDate}>{comment.date}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 옵션 메뉴 모달 */}
          <Modal
            visible={optionsVisible}
            transparent
            animationType="fade"
            onRequestClose={closeOptionsModal}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setOptionsVisible(false)}
            >
              <View style={styles.optionsModal}>
                <TouchableOpacity style={styles.optionItem} onPress={() => {
                  closeOptionsModal();
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
            onRequestClose={closeDeleteModal}
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
                  editable={!deleteLoading}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity onPress={closeDeleteModal} style={styles.modalButton} disabled={deleteLoading}>
                    <Text>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={requestDelete} style={[styles.modalButton, { marginLeft: 16 }]} disabled={deleteLoading}>
                    {deleteLoading ? (
                      <ActivityIndicator color="red" />
                    ) : (
                      <Text style={{ color: 'red' }}>삭제</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {canComment && (
            <View style={styles.commentForm}>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글 입력"
                value={commentInput}
                onChangeText={setCommentInput}
                editable={!commentSubmitting}
              />
              <TouchableOpacity
                style={styles.commentButton}
                onPress={handleAddComment}
                disabled={commentSubmitting || !commentInput.trim()}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>댓글 등록</Text>
              </TouchableOpacity>
            </View>
          )}

          <Button title="뒤로가기" onPress={() => router.replace('/(tabs)/(Community)/community')} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 40
  },

  contentBox: {
    flex: 0,
    width: "90%",
    borderRadius: 12,
    paddingBottom: 8,
    elevation: 1,
  },

  sectionBox: {
    width: "100%",
    borderRadius: 10,
    marginBottom: 30,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: "#000",
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
    marginVertical: 16,
    width: '90%'
  },

  commentsSection: {
    marginTop: 10
  },

  commentsTitle: {
    fontWeight: '600',
    marginBottom: 20,
    fontSize: 14,
    color: "#222"
  },

  commentItem: {
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },

  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  commentUser: {
    fontWeight: "bold",
    color: "#222",
  },

  commentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  commentForm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  commentInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: "#222",
    marginRight: 10,
  },

  commentButton: {
    backgroundColor: "#4287f5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 7,
  },

  loginText: {
    color: 'red'
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});
