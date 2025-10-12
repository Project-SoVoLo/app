import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import { Alert, DeviceEventEmitter, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import axios from '../api/axios';

export default function MainPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [cardNews, setCardNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 로그인 상태 체크 및 이벤트 구독
  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    checkLogin();

    const loginListener = DeviceEventEmitter.addListener('loginStateChange', checkLogin);
    return () => loginListener.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      if (isLoggedIn) {
        Promise.all([
          axios.get('/api/mypage/community-posts'),
          axios.get('/api/mypage/likes'),
          axios.get('/api/mypage/bookmarks'),
          axios.get('/api/card')
        ])
          .then(([postsRes, likesRes, bookmarksRes, cardRes]) => {
            setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
            setLikes(Array.isArray(likesRes.data) ? likesRes.data : []);
            setBookmarks(Array.isArray(bookmarksRes.data) ? bookmarksRes.data : []);
            setCardNews(Array.isArray(cardRes.data) ? cardRes.data.slice(0, 3) : []);
          })
          .catch(() => {
            Alert.alert('오류', '정보를 불러오지 못했습니다.');
            setPosts([]); setLikes([]); setBookmarks([]); setCardNews([]);
          })
          .finally(() => setLoading(false));
      } else {
        axios.get('/api/card')
          .then(cardRes => {
            setCardNews(Array.isArray(cardRes.data) ? cardRes.data.slice(0, 3) : []);
          })
          .catch(() => {
            Alert.alert('오류', '카드뉴스 정보를 불러오지 못했습니다.');
            setCardNews([]);
          })
          .finally(() => setLoading(false));
        setPosts([]); setLikes([]); setBookmarks([]);
      }
    }, [isLoggedIn])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <View style={styles.contentBox}>
          {/* 내가 작성한 글(커뮤니티만) */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>내가 작성한 글</Text>
            {isLoggedIn
              ? (posts.length > 0
                  ? posts.map((item, idx) => (
                      <TouchableOpacity 
                        style={styles.postItem} 
                        key={item.id ?? idx}
                        onPress={() => router.push(`/communitydetail?id=${item.id}`)}
                      >
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <Text style={styles.postUser}>{item.date}</Text>
                      </TouchableOpacity>
                  ))
                  : <Text>작성한 글이 없습니다.</Text>
                )
              : <Text>작성한 글을 보려면 로그인이 필요합니다.</Text>
            }
          </View>
          {/* 좋아요 목록(커뮤니티/공지) */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>좋아요 목록</Text>
            {isLoggedIn
              ? (likes.length > 0
                  ? likes.map((item, idx) => (
                      <TouchableOpacity
                        style={styles.postItem}
                        key={item.postId ?? item.id ?? idx}
                        onPress={() => {
                          // blocks 필드 존재 여부로 분기하여 커뮤니티 or 공지
                          if (item.hasOwnProperty('blocks')) {
                            // blocks 필드가 있어도 null일 수 있으므로 null 체크
                            if (item.blocks !== null) {
                              router.push(`/communitydetail?id=${item.id ?? item.postId}`);
                            } else {
                              router.push(`/noticedetail?postId=${item.postId ?? item.id}`);
                            }
                          } else {
                            // blocks 필드 자체가 없으면 공지글로 간주
                            router.push(`/noticedetail?postId=${item.postId ?? item.id}`);
                          }
                        }}
                      >
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <Text style={styles.postUser}>{item.date}</Text>
                      </TouchableOpacity>
                    ))
                  : <Text>좋아요 한 글이 없습니다.</Text>
                )
              : <Text>좋아요한 글을 보려면 로그인이 필요합니다.</Text>
            }
          </View>

          {/* 북마크 목록(커뮤니티만) */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>북마크 목록</Text>
            {isLoggedIn
              ? (bookmarks.length > 0
                  ? bookmarks.map((item, idx) => (
                      <TouchableOpacity
                        style={styles.postItem}
                        key={item.id ?? idx}
                        onPress={() => router.push(`/communitydetail?id=${item.id}`)}
                      >
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <Text style={styles.postUser}>{item.date}</Text>
                      </TouchableOpacity>
                  ))
                  : <Text>북마크한 글이 없습니다.</Text>
                )
              : <Text>북마크한 글을 보려면 로그인이 필요합니다.</Text>
            }
          </View>
          {/* 카드뉴스 3개만 표시: 로그인 불필요 */}
          <View style={styles.sectionBox}>
            <Text style={styles.CardSectionTitle}>카드뉴스</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              {cardNews.length > 0 ? cardNews.map((item, idx) => (
                <View style={styles.cardNewsItem} key={item.id ?? idx}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
              )) : <Text>카드뉴스가 없습니다.</Text>}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", paddingTop: 20 },
  contentBox: { flex: 0, width: "90%", borderRadius: 12, paddingBottom: 8, elevation: 1 },
  sectionBox: { width: "100%", backgroundColor: "#f2f2f2", borderRadius: 10, padding: 10, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 4, marginBottom: 6, marginLeft: 4, color: "#000" },
  CardSectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 4, marginBottom: 10, marginLeft: 4, color: "#000" },
  postItem: { backgroundColor: "#fff", padding: 11, marginVertical: 5, borderRadius: 8, alignItems: "flex-start", width: "99%", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  postTitle: { fontSize: 14, fontWeight: "bold", color: "#222", marginBottom: 3 },
  postUser: { fontSize: 12, color: "#666" },
  cardNewsItem: { width: "47%", backgroundColor: "#fff", padding: 8, borderRadius: 8, alignItems: "center", marginHorizontal: 2, marginBottom: 8, shadowColor: "#ccc", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1, elevation: 1 },
  cardImage: { width: "100%", height: 90, borderRadius: 7, marginBottom: 4 },
  cardTitle: { fontSize: 13, textAlign: "center", color: "#333" }
});
