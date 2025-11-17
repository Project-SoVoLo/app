import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import axios from "../api/axios";

export default function Consulation() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [data, setData] = useState(null);


  useEffect(() => {
    const fetchUserEmail = async () => {
    const email = await AsyncStorage.getItem('userEmail');
    const token = await AsyncStorage.getItem('token');
      if (email) {
        setUserEmail(email);
      }
      if (token){
        setToken(token);
      }
    };
      fetchUserEmail();
  }, []);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    axios.get('/api/mypage/chat-summaries', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        setData(res.data);
        console.log(res.data);
      })
      .catch(err => {
        Alert.alert("오류", "내역을 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

// AsyncStorage에 저장된 데이터들 확인하는 함수
//   const getAllData = async () => {
//   try {
//     const keys = await AsyncStorage.getAllKeys();
//     const result = await AsyncStorage.multiGet(keys);
//     result.forEach(([key, value]) => {
//       console.log(`Key: ${key}, Value: ${value}`);
//     });
//     return result;
//   } catch (e) {
//     console.error('Error reading AsyncStorage:', e);
//   }
// };
// getAllData();

  // data 콘솔 출력
  // useEffect(() => {
  // console.log(data);
  // }, [data]);


return (
  <View style={styles.container}>
    <Text style={styles.title}>상담내역</Text>
    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('../profile')}>
      <Text style={styles.backButtonText}>← 뒤로가기</Text>
    </TouchableOpacity>
  <ScrollView style={{ flex: 1 }}>
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>이메일</Text>
      <Text style={styles.infoText}>{userEmail || '정보 없음'}</Text>
    </View>


    {loading && <Text>로딩중...</Text>}

    {data && data.length > 0 ? (
      data.map((item, index) => (
        <View key={index} style={styles.itemBox}>
          <Text>날짜: {item.date}</Text>
          <Text>감정: {item.emotionKo}</Text>
          <Text>PHQ 점수: {item.phqScore}</Text>
          <Text>상담 요약: {item.summary}</Text>
          <Text>챗봇 피드백: {item.feedback}</Text>
        </View>
      ))
    ) : (
      !loading && <Text>상담내역이 없습니다.</Text>
    )}
  </ScrollView>
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  backButton: {
    marginBottom: 20,
  },

  backButtonText: {
    fontSize: 17,
    color: "#2c3e50",
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 36,
    color: "#253858",
  },

  infoBox: {
    marginBottom: 24,
  },

  infoLabel: {
    fontSize: 16,
    color: "#7f8a9a",
    fontWeight: "600",
  },

  infoText: {
    fontSize: 20,
    marginTop: 8,
    color: "#34495e",
    fontWeight: "500",
  },

  itemBox: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: "#f4f6fb",
    shadowColor: "#a3c4f3",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 4,
  },

  itemText: {
    fontSize: 15,
    color: "#34495e",
    marginBottom: 6,
  },
});
