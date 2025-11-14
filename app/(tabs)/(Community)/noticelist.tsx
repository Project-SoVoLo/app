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
    axios.get('/api/notice')
      .then(res => {
        const sorted = (res.data ?? []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotices(sorted);
      })
      .catch(() => Alert.alert('오류', '공지사항 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [])
);

  // useEffect(() => {
  //   axios.get('/api/notice')
  //     .then(res => {
  //       // console.log(res.data);
  //       const sorted = (res.data ?? []).sort((a, b) => new Date(b.date) - new Date(a.date));
  //       setNotices(sorted);
  //     })
  //     .catch(() => {
  //       Alert.alert('오류', '공지사항 목록을 불러오지 못했습니다.');
  //     })
  //     .finally(() => setLoading(false));
  // }, []);

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
      <Text style={styles.title}>공지사항 전체 목록</Text>
        <View style={styles.headerRow}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/community')}>
          <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>

        {role.toLowerCase() === 'admin' && (
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/noticewrite')}>
          <MaterialCommunityIcons name="plus" size={16} color="#000" />
        </TouchableOpacity>
      )}
        </View>
      {notices.map((item, idx) => (
        <TouchableOpacity
          key={item.id ?? idx}
          style={styles.noticeItem}
          onPress={() => router.push(`/noticedetail?postId=${item.postId}`)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>{item.title}</Text>
              <Text style={styles.noticeDate}>{item.date}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
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
        ))}
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

  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: 24,
    color: '#2c3e50',
    paddingLeft: 8,
  },

  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    paddingHorizontal: 8,
  },

  backButtonText: {
    fontSize: 17,
    color: "#253858",
    fontWeight: '600',
  },

  addButton: { 
    padding: 8,
  },

  noticeItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f4f6fb',
    shadowColor: "#a3c4f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  noticeTitle: { 
    fontSize: 17, 
    fontWeight: '700',
    color: '#2f3e67',
  },

  noticeDate: { 
    marginTop: 6, 
    fontSize: 13, 
    color: '#677294', 
  },

  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
  },

  iconCount: {
    marginLeft: 6,
    fontSize: 13,
    color: "#e0245e",
  },
});
