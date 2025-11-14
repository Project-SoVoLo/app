import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import axios from '../../api/axios';

export default function CardNewsList() {
  const [cardNews, setCardNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [role, setRole] = useState('');


useEffect(() => {
    AsyncStorage.getItem('role').then(r => setRole(r || ''));
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/card')
      .then(res => {
      let data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setCardNews(data);
        // console.log('cardNews 데이터:', res.data);
      })
      .catch(() => {
        Alert.alert('오류', '카드뉴스 정보를 불러오지 못했습니다.');
        setCardNews([]);
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
            <Text style={styles.title}>카드뉴스 전체 목록</Text>
            <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
              <Text style={styles.backButtonText}>← 뒤로가기</Text>
            </TouchableOpacity>
            
            {role.toLowerCase() === 'admin' && (
                    <TouchableOpacity style={styles.addButton} onPress={() => router.push('/cardnewswrite')}>
                      <MaterialCommunityIcons name="plus" size={16} color="#000" />
                    </TouchableOpacity>
                  )}
            
          </View>
          <View style={styles.sectionBox}>
                      {cardNews.length === 0 ? (
                        <Text>카드뉴스가 없습니다.</Text>
                      ) : (
            cardNews.map((item, idx) => (
              <TouchableOpacity 
              style={styles.cardNewsItem} 
              key={item.posId ?? idx}
              onPress={()=> router.push(`/cardnewsdetail?cardId=${item.postId}`)}
              >
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
                {item.description && (
                  <Text style={styles.cardContent}>{item.description}</Text>
                )}
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
    alignItems: "center",
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 12,
  },
  contentBox: { 
    width: "92%",
    borderRadius: 14,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    width: "100%",
  },
  sectionBox: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 30,
    paddingVertical: 3,
    paddingHorizontal: 1
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20, 
    marginLeft: 2, 
    color: "#253858"
  },
  cardNewsItem: {
    backgroundColor: "#f4f6fb",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    alignItems: "flex-start",
    width: "100%",
    shadowColor: "#a3c4f3",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  cardImage: { 
    width: "100%", 
    height: 160,
    borderRadius: 8,
    marginBottom: 14,
    backgroundColor: "#fff"
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#263040",
    marginBottom: 2
  },
  cardDate: { 
    fontSize: 12, 
    color: "#7a839a",
    marginBottom: 6,
    marginTop: 2
  },
  cardContent: { 
    fontSize: 15,
    color: "#313750",
    marginBottom: 3,
    marginTop: 2,
    lineHeight: 22
  },
  backButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 0
  },
  backButtonText: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "600",
  },
  addButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    marginLeft: 4,
  }
});
