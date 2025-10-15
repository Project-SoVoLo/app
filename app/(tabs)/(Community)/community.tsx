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
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
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
    paddingTop: 20,
    marginBottom: 90,
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
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 4,
    color: "#000",
  },
  CardSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
    marginBottom: 10,
    marginLeft: 4,
    color: "#000",
  },

  listContainer: {
    width: "100%",
  },

  postItem: {
    backgroundColor: "#fff",
    padding: 11,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: "flex-start",
    width: "99%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },

  postTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 3,
  },

  postUser: {
    fontSize: 12,
    color: "#666",
  },

  cardNewsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
  },

  cardNewsItem: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
    marginBottom: 8,
    shadowColor: "#ccc",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },

  cardImage: {
    width: "100%",
    height: 90,
    borderRadius: 7,
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#333",
  },

  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 14,
    width: 300,
    alignItems: "center",
    elevation: 3,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 7
  },

  input: {
    width: 170,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginVertical: 7,
    padding: 8
  },

  comment: {
    fontSize: 13,
    color: "#7a7a7a",
    marginTop: 3
  }
});
