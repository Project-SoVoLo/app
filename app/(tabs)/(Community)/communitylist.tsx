import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from '../../api/axios';

export default function NoticeList() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('role').then(r => setRole(r || ''));
  }, []);

  useFocusEffect(
  useCallback(() => {
    setLoading(true);
    axios.get('/api/community-posts')
      .then(res => {
        const sorted = (res.data ?? []).sort((a, b) => {
        // 작성일자 없을 경우 제일 아래로
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Number.NEGATIVE_INFINITY;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Number.NEGATIVE_INFINITY;
        return dateB - dateA;
});
setNotices(sorted);
      })
      .catch(() => Alert.alert('오류', '커뮤니티 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [])
);

//   useEffect(() => {
//     axios.get('/api/community-posts')
//       .then(res => {
//         // console.log(res.data);
//         const sorted = (res.data ?? []).sort((a, b) => new Date(b.date) - new Date(a.date));
//         setNotices(sorted);
//       })
//       .catch(() => {
//         Alert.alert('오류', '공지사항 목록을 불러오지 못했습니다.');
//       })
//       .finally(() => setLoading(false));
//   }, []);

  if (loading) {
    return (
      <View style={styles.container}>
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
          <Text style={styles.title}>커뮤니티 전체 목록</Text>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(tabs)/(Community)/community')}
            >
              <Text style={styles.backButtonText}>← 뒤로가기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/communitywrite')}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionBox}>
            {notices.length === 0 ? (
              <Text>커뮤니티가 없습니다.</Text>
            ) : (
              notices
                .filter(item => !!item.title)
                .map((item, idx) => (
                  <TouchableOpacity
                    key={item.id ?? idx}
                    style={styles.noticeItem}
                    onPress={() => router.push(`/communitydetail?id=${item.id}`)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noticeTitle}>{item.title}</Text>
                        <Text style={styles.noticeDate}>닉네임 : {item.nickname ?? '익명'}</Text>
                        <Text style={styles.noticeDate}>작성일자 : {item.createdAt}</Text>
                      </View>
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
    paddingTop: 24,
  },

  contentBox: {
    width: "92%",
    borderRadius: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },

  sectionBox: {
    width: "100%",
    borderRadius: 14,
    marginBottom: 30,
    padding: 14,
    shadowColor: "#bec9e4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#253858",
    marginLeft: 8,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    width: "100%",
    paddingHorizontal: 8,
  },

  backButtonText: {
    fontSize: 17,
    color: "#2d3f60",
    fontWeight: "600",
  },

  addButton: {
    padding: 8,
  },

  noticeItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: "#f4f6fb",
    shadowColor: "#a3c4f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 4,
  },

  noticeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2e435f",
  },

  noticeDate: {
    marginTop: 6,
    fontSize: 13,
    color: "#708090",
  },

  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 14,
    marginTop: 6,
  },

  iconCount: {
    marginLeft: 6,
    fontSize: 13,
    color: "#e0245e",
    fontWeight: "600",
  },
});
