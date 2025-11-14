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
        backgroundColor : "#ffff",
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    
    backButton: {
        marginBottom: 16,
    },
    
    backButtonText: {
        fontSize: 16,
        color: "#000",
    },
      infoBox: {
    marginBottom: 20,
    },
  
    infoLabel: {
      fontSize: 16,
      color: '#888',
    },
    
    infoText: {
      fontSize: 20,
      marginTop: 4,
    },
    
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 30,
    },
    
    itemBox: {
      padding: 12,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      marginBottom: 10,
      backgroundColor: '#f9f9f9',
    },

});
