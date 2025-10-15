import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import axios from "../api/axios";

export default function SelfTest() {
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
      axios.get('/api/diagnosis/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          setData(res.data);
        })
        .catch(err => {
          Alert.alert("오류", "내역을 불러오지 못했습니다.");
        })
        .finally(() => {
          setLoading(false);
        });
    }, [token]);

      const groupedData = useMemo(() => {
        if (!data) return {};
        return data.reduce((acc, item) => {
          const key = item.diagnosisType || "기타";
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});
      }, [data]);
    
    // useEffect(()=>{
    //   console.log(data);
    // } ,[data]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>자가진단내역</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('../profile')}>
          <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>이메일</Text>
          <Text style={styles.infoText}>{userEmail || '정보 없음'}</Text>
        </View>
    
    
        {loading && <Text>로딩중...</Text>}
        
        {/* 1. 분류없이 한번에 보이는 방법
         {data && data.length > 0 ? (
          data.map((item, index) => (
            <View key={index} style={styles.itemBox}>
              <Text>날짜: {item.diagnosisDate}</Text>
              <Text>점수: {item.diagnosisScore}</Text>
              <Text>감정: {item.diagnosisType}</Text>
            </View>
          ))
        ) : (
          !loading && <Text>자가진단 내역이 없습니다.</Text>
        )} */}
        
        {/* 2. 자가진단 항목에 대한 분류 진행*/}
        {data && data.length > 0 ? (
        Object.entries(groupedData).map(([type, items]) => (
          <View key={type} style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>{type}</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.itemBox}>
                <Text>날짜: {item.diagnosisDate}</Text>
                <Text>점수: {item.diagnosisScore}</Text>
              </View>
            ))}
          </View>
          ))
        ) : (
        !loading && <Text>자가진단 내역이 없습니다.</Text>
        )}
      </ScrollView>
      </View>
  );
}

{/* 
        <Text style={styles.sectionTitle}>상세 내역</Text>
        {data && data.length > 0 ? (
          Object.entries(groupedData).map(([type, items]) => (
            <View key={type} style={{ marginBottom: 20 }}>
              <Text style={styles.sectionTitle}>{type}</Text>
              {items.map((item, index) => (
                <View key={index} style={styles.itemBox}>
                  <Text>날짜: {item.diagnosisDate}</Text>
                  <Text>점수: {item.diagnosisScore}</Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          !loading && <Text>조회 가능한 내역이 없습니다.</Text>
        )} */}
         
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor : "#fff",
        paddingHorizontal: 16,
        paddingTop: 20,
    },

    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 30,
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
    
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
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
