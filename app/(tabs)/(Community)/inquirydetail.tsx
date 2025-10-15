import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from '../../api/axios';

export default function InquiryDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const [optionsVisible, setOptionsVisible] = useState(false);

  //삭제 비밀번호 입력 모달
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

  //열람 기능
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
        <Button title="뒤로가기" onPress={() => router.replace('/(tabs)/(Community)/community')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ paddingBottom: 90 }}
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

          {/* 댓글 리스트+입력란 sectionBox */}
          <View style={styles.sectionBox}>
            {/* 댓글 리스트 */}
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
    marginLeft: 4,
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
  }
});
