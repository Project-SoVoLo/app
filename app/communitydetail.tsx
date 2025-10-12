import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from './api/axios';

export default function CommunityDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState('');
  const [nickname,setNickname] = useState('');
  const [role, setRole] = useState('');
  
  //수정 관련
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const isOwner = post?.nickname === nickname;

  //좋아요 관련
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  //북마크 관련
  const [bookmarked, setBookmarked] = useState(post?.bookmarkedByMe ?? false);
  const [bookmarkCount, setBookmarkCount] = useState(post?.bookmarkCount ?? 0);

  // 댓글 관련
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [comments, setComments] = useState([]);

  //댓글 수정 관련
  const [editCommentModalVisible, setEditCommentModalVisible] = useState(false);
  const [editCommentId, setEditCommentId] = useState('');
  const [editCommentContent, setEditCommentContent] = useState('');

  //좋아요 개수 및 본인 좋아요 확인
  useEffect(() => {
    if (post) {
      setLiked(Boolean(post.likedByMe));
      setLikeCount(post.likeCount || 0);
    }
  }, [post]);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
    AsyncStorage.getItem('userEmail').then(email => setUserId(email || ''));
    AsyncStorage.getItem('role').then(r => setRole(r || ''));
    AsyncStorage.getItem('nickname').then(nickname => setNickname(nickname || ''))
  }, []);

  //글 상세 조회
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/community-posts/${id}`)
      .then(res =>{
        // console.log(res.data);
        setPost(res.data)})
      .catch(() =>
        Alert.alert('오류', '커뮤니티 게시글 상세를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
    axios.get(`/api/community-posts/${id}/comments`)
    .then(res => {
        // console.log(res.data);
        setComments(res.data)
    })
    .catch(() => setComments([]));
  }, [id, authToken]);

  //좋아요 토글
  const handleLike = async () => {
    try {
      const res = await axios.post(
        `/api/community-posts/${id}/likes`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data !== undefined) {
        setLiked(Boolean(res.data));
        setLikeCount(likeCount + (liked ? -1 : 1));
      }
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '좋아요 처리 실패');
    }
  };

  //글 수정 모달
  const openEditModal = () => {
    setEditTitle(post?.title ?? '');
    const textBlocks = post?.blocks?.filter(b => b.type === 'text').map(b => b.content).join('\n') ?? '';
    setEditContent(textBlocks);
    setEditModalVisible(true);
    setOptionsVisible(false);
  };

  //글 수정 api
  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력하세요.');
      return;
    }
    try {
      await axios.put(
        `/api/community-posts/${id}`,
        { title: editTitle, blocks: [{ type: 'text', content: editContent }] },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setPost(prev => prev ? ({ ...prev, title: editTitle, blocks: [{ type: 'text', content: editContent }] }) : prev);
      setEditModalVisible(false);
      Alert.alert('수정 완료', '커뮤니티 게시글이 수정되었습니다.');
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '수정 실패');
    }
  };

  //글 삭제 api
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/community-posts/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      Alert.alert('삭제 완료', '게시글이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.replace('/communitylist') }
      ]);
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '삭제 실패');
    }
    setOptionsVisible(false);
  };

  // 댓글 작성
  const handleAddComment = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 바랍니다.');
      return;
    }
    if (!commentInput.trim()) return;
    setCommentSubmitting(true);

    try {
      await axios.post(
        `/api/community-posts/${id}/comments`,
        { userId, content: commentInput },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      // 댓글 등록 직후 최신 댓글 목록 재조회
      const res = await axios.get(`/api/community-posts/${id}/comments`);
      setComments(res.data);
      setCommentInput('');
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '댓글 등록 실패');
    }
    setCommentSubmitting(false);
  };

  //댓글 수정
  const handleEditComment = async () => {
  if (!editCommentContent.trim()) {
    Alert.alert('입력 오류', '댓글 내용을 입력하세요.');
    return;
  }
  try {
    await axios.put(
      `/api/community-posts/${id}/comments/${editCommentId}`,
      { content: editCommentContent },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    // 성공 시 최신 목록 재조회
    const res = await axios.get(`/api/community-posts/${id}/comments`);
    setComments(res.data);
    setEditCommentModalVisible(false);
    setEditCommentContent('');
  } catch (e) {
    Alert.alert('오류', e.response?.data?.message || '댓글 수정 실패');
  }
};

  //댓글 수정 모달
  const openEditCommentModal = (comment) => {
    setEditCommentId(comment.commentId);
    setEditCommentContent(comment.content);
    setEditCommentModalVisible(true);
  };

  //댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 바랍니다.');
      return;
    }
    Alert.alert('댓글 삭제', '정말 삭제하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel'
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`/api/community-posts/${id}/comments/${commentId}`, {
              headers: { Authorization: `Bearer ${authToken}` }
            });
            // 삭제 후 최신 댓글 목록 재로드
            const res = await axios.get(`/api/community-posts/${id}/comments`);
            setComments(res.data);
            Alert.alert('완료', '댓글이 삭제되었습니다.');
          } catch (e) {
            Alert.alert('오류', e.response?.data?.message || '댓글 삭제 실패');
          }
        }
      }
    ]);
  };


  //북마크 개수 및 본인 북마크 확인
  useEffect(() => {
  if (post) {
    setBookmarked(Boolean(post.bookmarkedByMe));
    setBookmarkCount(post.bookmarkCount || 0);
  }
}, [post]);

  //북마크 api
  const handleBookmark = async () => {
    try {
      const res = await axios.post(
        `/api/community-posts/${id}/bookmarks`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data !== undefined) {
        setBookmarked(Boolean(res.data));
        setBookmarkCount(bookmarkCount + (bookmarked ? -1 : 1));
      }
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '북마크 처리 실패');
    }
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>게시글이 존재하지 않습니다.</Text>
        <Button title="뒤로가기" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {isOwner && (
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setOptionsVisible(true)}>
          <MaterialIcons name="more-vert" size={26} color="#444" />
        </TouchableOpacity>
      </View>
    )}
      {/* 좋아요,북마크 버튼 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={handleLike}>
          <MaterialIcons
            name={liked ? 'favorite' : 'favorite-border'}
            size={28}
            color={liked ? '#e0245e' : '#888'}
          />
        </TouchableOpacity>
        <Text style={{ marginLeft: 6, fontSize: 16 }}>{likeCount}</Text>

        <TouchableOpacity onPress={handleBookmark} style={{ marginLeft: 18 }}>
          <MaterialIcons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={bookmarked ? '#ffbb33' : '#888'}
          />
        </TouchableOpacity>
        <Text style={{ marginLeft: 5, fontSize: 16 }}>{bookmarkCount}</Text>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.date}>작성자: {post.nickname ?? '익명'} / {post.createdAt?.slice(0,10) ?? post.updatedAt?.slice(0,10) ?? '-'}</Text>
      {post.blocks && post.blocks.map((block, idx) => (
        block.type === 'text'
          ? <Text key={idx} style={styles.content}>{block.content}</Text>
          : block.type === 'image' && block.url
            ? <Image key={idx} source={{ uri: block.url }} style={styles.image} />
            : null
      ))}

      {/* 댓글 표시 */}
      {comments?.length > 0 && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>댓글</Text>
          {comments.map((comment, idx) => (
            <View key={idx} style={[
              styles.commentItem,
              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
            ]}>
              <View>
                <Text>{comment.nickname}: {comment.content}</Text>
                <Text style={styles.commentDate}>{comment.date}</Text>
              </View>
              {/* 본인 댓글만 아이콘 2개 노출 */}
              {(comment.nickname === nickname) && (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => openEditCommentModal(comment)}
                    style={{ marginHorizontal: 6 }}>
                    <MaterialIcons name="edit" size={20} color="#007bff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(comment.commentId)}
                    style={{ marginHorizontal: 6 }}>
                    <MaterialIcons name="delete" size={20} color="#b44" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/*댓글 수정 모달*/}
      <Modal
        visible={editCommentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditCommentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModal}>
            <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>댓글 수정</Text>
            <TextInput
              placeholder="댓글 내용"
              value={editCommentContent}
              onChangeText={setEditCommentContent}
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setEditCommentModalVisible(false)} style={styles.modalButton}>
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditComment} style={[styles.modalButton, { marginLeft: 16 }]}>
                <Text style={{ color: '#007bff' }}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* 댓글 입력 */}
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

      <Button title="뒤로가기" onPress={() => router.back()} />

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

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModal}>
            <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>커뮤니티 글 수정</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  date: { fontSize: 14, color: '#666', marginBottom: 12 },
  content: { fontSize: 16, lineHeight: 22, marginBottom: 6 },
  image: { width: '100%', height: 160, borderRadius: 7, marginBottom: 12 },
  commentsSection: { marginTop: 24 },
  commentsTitle: { fontWeight: '600', marginBottom: 8 },
  commentItem: { marginBottom: 8 },
  commentDate: { fontSize: 12, color: '#666' },
  commentForm: { marginTop: 20 },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10, marginVertical: 16 },
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
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
