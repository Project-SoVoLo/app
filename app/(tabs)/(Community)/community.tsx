import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import axios from '../../api/axios';


const getLatest = (data, n) =>
  [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, n);

const uniqueByPostId = (array) => {
  const seen = new Set();
  return array.filter(item => {
    if (seen.has(item.postId)) return false;
    seen.add(item.postId);
    return true;
  });
};

export default function Community() {
  const [notices, setNotices] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null); 
  const alertShown = useRef(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inquiryPassword, setInquiryPassword] = useState('');
  const [inquiryDetail, setInquiryDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const router = useRouter();

  //   useEffect(() => {
  //     const printAllStorage = async () => {
  //       try {
  //         const keys = await AsyncStorage.getAllKeys();
  //         if (keys.length === 0) {
  //           console.log('AsyncStorage: 없음');
  //           return;
  //         }
  //         const items = await AsyncStorage.multiGet(keys);
  //         items.forEach(([key, value]) => {
  //           console.log(`${key}: ${value !== null ? value : 'null'}`);
  //         });
  //       } catch (e) {
  //         console.error('AsyncStorage 오류:', e);
  //       }
  //     };
    
  //     printAllStorage();
  // }, []);


  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setToken(token));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      if (!token) {
        //비로그인 시 공지사항, 건의사항만 호출
        Promise.all([
          axios.get('/api/notice'),
          axios.get('/api/inquiry/all')
        ])
        .then(([noticeRes, suggestionRes]) => {
          const noticesData = Array.isArray(noticeRes.data) ? noticeRes.data : [];
          const suggestionsData = Array.isArray(suggestionRes.data) ? suggestionRes.data : [];
          setNotices(getLatest(uniqueByPostId(noticesData), 3));
          setSuggestions([...suggestionsData].reverse().slice(0, 3));
          setCommunity([]);
        })
        .catch(() => {
          Alert.alert('오류', '정보를 불러오지 못했습니다.');
          setNotices([]);
          setSuggestions([]);
          setCommunity([]);
        })
        .finally(() => setLoading(false));
      } else {
        //로그인 시 전부 호출
        Promise.all([
          axios.get('/api/notice'),
          axios.get('/api/inquiry/all'),
          axios.get('/api/community-posts')
        ])
        .then(([noticeRes, suggestionRes, communityRes]) => {
          const noticesData = Array.isArray(noticeRes.data) ? noticeRes.data : [];
          const suggestionsData = Array.isArray(suggestionRes.data) ? suggestionRes.data : [];
          const communityData = Array.isArray(communityRes.data) ? communityRes.data : [];
          setNotices(getLatest(uniqueByPostId(noticesData), 3));
          setSuggestions([...suggestionsData].reverse().slice(0, 3));
          const sortedCommunity = [...communityData]
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
              return dateB - dateA;
            })
            .slice(0, 3);
          setCommunity(sortedCommunity);
        })
        .catch(() => {
          Alert.alert('오류', '정보를 불러오지 못했습니다.');
          setNotices([]);
          setSuggestions([]);
          setCommunity([]);
        })
        .finally(() => setLoading(false));
      }
    }, [token])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text>불러오는 중...</Text>
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
          
          {/* 공지사항 목록 */}
          <View style={styles.sectionBox}>
            <TouchableOpacity onPress={() => router.push('/noticelist')}>
              <Text style={styles.sectionTitle}>공지사항</Text>
            </TouchableOpacity>
            {notices.length > 0 ? notices.map((item, idx) => (
              <TouchableOpacity
                key={item.postId ?? idx}
                onPress={() => router.push(`/noticedetail?postId=${item.postId}`)}
              >
                <View style={[styles.postItem, { flexDirection: "row", alignItems: "center" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text style={styles.postUser}>{item.date}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name={item.liked ? "heart" : "heart-outline"}
                      size={18}
                      color="#e0245e"
                    />
                    <Text style={{ marginLeft: 4, fontSize: 13, color: "#e0245e" }}>
                      {item.likeCount ?? 0}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )) : <Text>게시글이 없습니다.</Text>}
          </View>

          {/* 건의사항 목록 */}
          <View style={styles.sectionBox}>
            <TouchableOpacity onPress={() => router.push('/inquirylist')}>
              <Text style={styles.sectionTitle}>건의사항</Text>
            </TouchableOpacity>
            {suggestions.length > 0 ? suggestions.map((item, idx) => (
              <TouchableOpacity 
                key={item.id ?? idx} 
                onPress={() => router.push(`/inquirydetail?id=${item.id}`)}
              >
                <View style={styles.postItem}>
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postUser}>작성자: {item.author}</Text>
                </View>
              </TouchableOpacity>
            )) : <Text>게시글이 없습니다.</Text>}
          </View>
          
            {/* 커뮤니티 목록 */}
            <View style={styles.sectionBox}>
              <TouchableOpacity
                disabled={!token}
                onPress={() => token && router.push('/communitylist')}
                style={[
                  !token && { opacity: 0.5 }
                ]}
              >
                <Text style={styles.sectionTitle}>커뮤니티</Text>
              </TouchableOpacity>
              {!token ? 
              <Text style=
              {{ color: "#888", textAlign: "center" }}>
                로그인 후 커뮤니티를 이용할 수 있습니다.
                </Text>
              : community.length > 0 ? community.map((item, idx) => (
                <TouchableOpacity
                  key={item.id ?? idx}
                  onPress={() => router.push(`/communitydetail?id=${item.id}`)}
                >
                  <View style={[styles.postItem, { flexDirection: "row", alignItems: "center" }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.postTitle}>{item.title}</Text>
                      <Text style={styles.postUser}>작성자: {item.nickname ?? item.author}</Text>
                    </View>
                      {/* 좋아요/북마크 아이콘+카운트 추가 */}
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialCommunityIcons
                          name={item.likedByMe ? "heart" : "heart-outline"}
                          size={18}
                          color="#e0245e"
                        />
                        <Text style={{ marginLeft: 4, fontSize: 13, color: "#e0245e" }}>
                          {item.likeCount ?? 0}
                        </Text>
                        <MaterialCommunityIcons
                          name={item.bookmarkedByMe ? "bookmark" : "bookmark-outline"}
                          size={18}
                          color="#ffaa33"
                          style={{ marginLeft: 14 }}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                )) : <Text>게시글이 없습니다.</Text>}
              </View>
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
  },

  contentBox: {
    width: "92%",
    borderRadius: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#b7c1d9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 6,
  },

  sectionBox: {
    width: "100%",
    backgroundColor: "#f4f6fb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 28,
    shadowColor: "#acb7d6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginLeft: 6,
    color: "#253858",
  },

  postItem: {
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 8,
    borderRadius: 12,
    alignItems: "flex-start",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#c0c9dd",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  postTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
    flex: 1,
    flexWrap: "wrap",
  },

  postUser: {
    fontSize: 13,
    color: "#718096",
  },

  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCount: {
    marginLeft: 6,
    fontSize: 13,
    color: "#e0245e",
  },

  bookmarkIcon: {
    marginLeft: 16,
  },

  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: 320,
    alignItems: "center",
    shadowColor: "#415A9B",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2f3e66",
  },

  input: {
    width: 180,
    borderWidth: 1,
    borderColor: "#c8d0e7",
    borderRadius: 10,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#334155",
  },

  comment: {
    fontSize: 14,
    color: "#718096",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
});
