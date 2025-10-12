import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from './api/axios';

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
        // 작성일자가 없으면 숫자 최대값으로 간주해 맨 아래로 보냄
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Number.NEGATIVE_INFINITY;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Number.NEGATIVE_INFINITY;
        // 최신순
        return dateB - dateA;
});
setNotices(sorted);
      })
      .catch(() => Alert.alert('오류', '공지사항 목록을 불러오지 못했습니다.'))
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>커뮤니티 전체 목록</Text>
        <View style={styles.headerRow}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/community')}>
          <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/communitywrite')}>
          <MaterialCommunityIcons name="plus" size={16} color="#000" />
        </TouchableOpacity>

        </View>
      {notices
      .filter(item => !!item.title) //title없으먼 필터링
      .map((item, idx) => (
        
        <TouchableOpacity
          key={item.id ?? idx}
          style={styles.noticeItem}
          onPress={() => router.push(`/communitydetail?id=${item.id}`)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>{item.title}</Text>
              <Text style={styles.noticeDate}>닉네임 : {item.nickname?? '익명'}</Text>
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
        ))}
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
    marginBottom: 20
    },
    
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },

  noticeItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    },

  noticeTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
    },

  noticeDate: { 
    marginTop: 4, 
    fontSize: 12, 
    color: '#666' 
    },

  backButton: {
    marginBottom: 16,
    },
        
  backButtonText: {
    fontSize: 16,
    color: "#000",
    },

  addButton: { 
    marginBottom: 16,
    },

});
