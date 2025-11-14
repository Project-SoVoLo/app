import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import axios from "../../api/axios";


export default function Dashboard() {
  const [comments, setComments] = useState([]);
  const POLLING_INTERVAL = 10000;
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [text, setText] = useState('');

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  const currentUsers = users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(users.length / PAGE_SIZE);

  // AsyncStorage 확인용
  useEffect(() => {
    const printAllStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        if (keys.length === 0) {
          console.log('AsyncStorage: 없음');
          return;
        }
        const items = await AsyncStorage.multiGet(keys);
        items.forEach(([key, value]) => {
          console.log(`${key}: ${value !== null ? value : 'null'}`);
        });
      } catch (e) {
        console.error('AsyncStorage 오류:', e);
      }
    };
    printAllStorage();
  }, []);

  useEffect(() => {
    let intervalId;

    const fetchComments = async () => {
      try {
        const res = await axios.get('/api/admins/inquiry/comments?limit=50');
        setComments(Array.isArray(res.data.items) ? res.data.items : []);
        // console.log('Fetched comments:', res.data.items);
      } catch (e) {
        setComments([]);
      }
    };

    fetchComments();
    intervalId = setInterval(fetchComments, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  const fetchUsers = async (query = '') => {
    try {
      const params = query
        ? { query, page: 0, size: 50 }
        : { page: 0, size: 50 };
      const res = await axios.get('/api/admins/users', { params });
      setUsers(Array.isArray(res.data.content) ? res.data.content : []);
      setPage(0);
    } catch (e) {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers('');
  }, []);

  return (
          <ScrollView
            style={{ flex: 1, backgroundColor: "#fff" }}
            contentContainerStyle={{ paddingBottom: 60 }}
            >
            <View style={styles.container}>
              <View style={styles.contentBox}>

              {/* 사용자 목록 */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>사용자 목록</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <TextInput
                style={styles.searchInput}
                value={text}
                onChangeText={setText}
                placeholder="이름 또는 이메일 검색"
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => fetchUsers(text)}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => fetchUsers(text)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>조회</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: '#f2f2fa', marginLeft: 4 }]}
                onPress={() => {
                  setText('');
                  fetchUsers('');
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>전체</Text>
              </TouchableOpacity>
            </View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText,{ flex: 0.4}]}>이름</Text>
                  <Text style={[styles.tableHeaderText,{ flex: 1.5}]}>이메일</Text>
                  <Text style={[styles.tableHeaderText,{ flex: 1.2}]}>ID</Text>
                </View>
                {users.length === 0 ? (
                  <Text style={styles.emptyText}>사용자 없음</Text>
                ) : (
                  currentUsers.map((user) => (
                    <View key={user.userId} style={styles.tableRow}>
                      <Text style={[styles.tableCell, {flex:0.4}]}>{user.userName}</Text>
                      <Text style={[styles.tableCell, {flex:1.5}]}>{user.userEmail}</Text>
                      <Text style={[styles.tableCell, {flex:1.2}]}>{user.userId}</Text>
                    </View>
                  ))
                )}
                <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.button,
                        { width: 36, marginHorizontal: 4, backgroundColor: page === i ? "#007AFF" : "#f2f2fa" }
                      ]}
                      onPress={() => setPage(i)}
                    >
                      <Text style={[styles.buttonText, { color: page === i ? "#fff" : "#000", fontSize: 15 }]}>
                        {i + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>


              {/*  네비게이션 버튼 */}
              <View style={[styles.sectionBox, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/noticelist')}>
                  <Text style={styles.buttonText}>공지사항</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/inquirylist')}>
                  <Text style={styles.buttonText}>건의사항</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/communitylist')}>
                  <Text style={styles.buttonText}>커뮤니티</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/cardnewslist')}>
                  <Text style={styles.buttonText}>카드뉴스</Text>
                </TouchableOpacity>
              </View>

              {/*  건의함 최근 댓글 */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>실시간 건의함 댓글</Text>
                  {comments.length === 0 ? (
                    <Text style={styles.emptyText}>최근 댓글 없음</Text>
                  ) : (
                    comments.map((item, idx) => (
                      <TouchableOpacity key={item.commentId ?? idx} onPress={() => 
                      { console.log(item.inquiryId);
                        router.push(`/inquirydetail?id=${item.inquiryId}`)}}>  
                      <View key={item.commentId ?? idx} style={styles.feedBox}>
                        <Text style={styles.commentText}>댓글: {item.excerpt}</Text>
                        <Text style={styles.commentText}>작성자: {item.authorName}</Text>
                        <Text style={styles.commentText}>제목: {item.title}</Text>
                        <Text style={styles.commentDate}>{item.createdAt}</Text>
                      </View>
                      </TouchableOpacity>
                    ))
                  )}
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
    paddingBottom: 20,
  },

  contentBox: { 
    width: "100%", 
    borderRadius: 16, 
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#a3bde0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 7,
  },

  sectionBox: { 
    marginBottom: 30,
    backgroundColor: "#f7faff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#c2d1f0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },

  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 14, 
    color: "#274593",
  },

  button: {
    width: '48%',
    backgroundColor: '#4a90e2',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#3367d6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  emptyText: { 
    color: "#888", 
    textAlign: "center", 
    marginTop: 30,
    fontSize: 15,
    fontStyle: "italic",
  },

  feedBox: { 
    backgroundColor: "#ffffff", 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 10,
    shadowColor: "#b7c3e3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
  },

  commentText: { 
    fontSize: 15, 
    color: "#323232", 
    marginBottom: 6,
    fontWeight: '500',
  },
  
  commentDate: { 
    fontSize: 12, 
    color: "#7a7a7a",
    fontStyle: "italic",
  },
  
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dce6f7",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 8,
  },

  tableHeaderText: {
    flex: 1,
    fontWeight: "700",
    color: "#2b3a67",
    fontSize: 14,
    textAlign: "center"
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7f1",
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: "#fafcff",
  },

  tableCell: {
    flex: 1,
    color: "#444",
    fontSize: 13,
    textAlign: "center"
  },

  searchInput: {
    flex: 1,
    borderColor: "#9bb3e0",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#fff",
    marginRight: 8,
    shadowColor: "#e4e9f9",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  
  searchButton: {
    backgroundColor: "#2e5ecc",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#234892",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
});
