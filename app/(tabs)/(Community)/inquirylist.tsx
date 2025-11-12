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

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    width: "100%",
  },

  postItem: {
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fafafa',
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

  backButton: {
    marginBottom: 16,
  },

  backButtonText: {
    fontSize: 16,
    color: "#000",
  },

  addButton: {
    marginBottom: 16,
  }

});
