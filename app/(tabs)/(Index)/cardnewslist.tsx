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
                  source={{ uri: item.imageUrl }}
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
  },

  contentBox: { 
    flex: 0,
    width: "90%",
    borderRadius: 12,
    paddingBottom: 8,
    elevation: 1,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    width: "100%",
  },

    sectionBox: {
    width: "100%",
    borderRadius: 10,
    marginBottom: 30,
  },

  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20, 
    marginLeft: 4, 
    color: "#000" 
  },

  cardNewsItem: {
    backgroundColor: "#fafafa",
    padding: 11,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: "flex-start",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20
  },

  cardImage: { 
    width: "100%", 
    height: 160,
    borderRadius: 7,
    marginBottom: 12
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4
  },

  cardDate: { 
    fontSize: 12, 
    color: "#666",
    marginBottom: 8
  },

  cardContent: { 
    fontSize: 15,
    color: "#222",
    marginBottom: 4,
    lineHeight: 22
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
