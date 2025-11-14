import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from '../../api/axios';

export default function InquiryList() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios.get('/api/inquiry/all')
      .then(res => {
        const reversed = (res.data ?? []).slice().reverse();
        setNotices(reversed);
        // console.log(res.data)
      })
      .catch(() => {
        Alert.alert('오류', '건의사항 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

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
          <Text style={styles.title}>건의사항 전체 목록</Text>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/(Community)/community')}>
              <Text style={styles.backButtonText}>← 뒤로가기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/inquirywrite')}>
              <MaterialCommunityIcons name="plus" size={16} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionBox}>
            {notices.length === 0 ? (
              <Text>건의사항이 없습니다.</Text>
            ) : (
              notices.map((item, idx) => (
                <TouchableOpacity
                  key={item.inquiryId ?? idx}
                  style={styles.postItem}
                  onPress={() => router.push(`/inquirydetail?id=${item.id}`)}
                >
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postUser}>{item.author}</Text>
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

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 22,
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
    color: "#2c3e50",
    fontWeight: "600",
  },

  addButton: {
    padding: 8,
  },

  sectionBox: {
    width: "100%",
    borderRadius: 14,
    marginBottom: 30,
  },

  postItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: "#f4f6fb",
    shadowColor: "#a3c4f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e3e62",
    marginBottom: 6,
  },

  postUser: {
    fontSize: 13,
    color: "#62718d",
  },
});
