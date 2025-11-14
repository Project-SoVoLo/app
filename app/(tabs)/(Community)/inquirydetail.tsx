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
          // console.log(userId)
          // console.log(res.data)
          // console.log(res.data.author)
          Alert.alert('권한 오류', '본인의 글만 열람할 수 있습니다.');
          setInquiry(null);
        } else {
          setInquiry(res.data);
          console.log(res.data)
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
          <Text style={styles.author}>작성자: {inquiry.author}</Text>
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
    paddingTop: 24,
    paddingBottom: 30,
  },

  contentBox: {
    width: "92%",
    backgroundColor: "#f4f6fb",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    elevation: 3,
    shadowColor: "#a3c4f3",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    marginBottom: 28,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 24,
  },

  content: {
    fontSize: 16,
    color: "#34495e",
    marginBottom: 20,
    lineHeight: 23,
  },

  author: {
    fontSize: 14,
    color: "#62718d",
    marginBottom: 12,
  },

  input: {
    width: "92%",
    borderColor: "#cbd2e0",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
    marginTop: 12,
  },

  sectionBox: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#f4f6fb",
    marginTop: 12,
    marginBottom: 28,
  },

  commentsSection: {
    marginTop: 16,
  },

  commentsTitle: {
    fontWeight: "700",
    color: "#2c3e50",
    fontSize: 16,
    marginBottom: 18,
  },

  commentItem: {
    backgroundColor: "#f9fafc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#b0c4de",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  commentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  commentUser: {
    fontWeight: "600",
    color: "#253858",
  },

  commentDate: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },

  commentForm: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },

  commentInput: {
    flex: 1,
    borderColor: "#cbd2e0",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#34495e",
    marginRight: 12,
  },

  commentButton: {
    backgroundColor: "#4e7bec",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },

  loginText: {
    color: "#b44",
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  optionsModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 140,
    marginTop: 32,
    marginRight: 24,
    elevation: 6,
    shadowColor: "#244aab",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },

  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  optionText: {
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 14,
    fontWeight: "600",
  },

  deleteModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: 320,
    elevation: 10,
    shadowColor: "#2e3e62",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },

  modalButton: {
    padding: 14,
  },
});
