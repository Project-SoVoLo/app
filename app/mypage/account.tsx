import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet ,TouchableOpacity, Alert} from "react-native";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "../api/axios";

export default function Account() {
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
    axios.get('/api/mypage/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        Alert.alert("오류", "계정 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

    const formatBirth = (birth) => {
    if (!birth) return '';
    return birth.replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일');
    };

    const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    };

    // useEffect(() => {
    // console.log(data);
    // }, [data]);

  return (
    <View style={styles.container}>
        <View style={styles.content}>
            <Text style={styles.title}>계정 정보</Text>

        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('../profile')}>
          <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>

        {loading && <Text>로딩중...</Text>}

            <Text style={styles.subtitle}>이름</Text>
                <Text style={styles.value}>{data?.userName}</Text>
                
                <Text style={styles.subtitle}>성별</Text>
                <Text style={styles.value}>{data?.userGender === "M" ? "남자" : "여자"}</Text>
                
                <Text style={styles.subtitle}>닉네임</Text>
                <Text style={styles.value}>{data?.nickname}</Text>
                
                <Text style={styles.subtitle}>이메일</Text>
                <Text style={styles.value}>{data?.userEmail}</Text>
                
                <Text style={styles.subtitle}>생년월일</Text>
                <Text style={styles.value}>{formatBirth(data?.userBirth)}</Text>
                
                <Text style={styles.subtitle}>전화번호</Text>
                <Text style={styles.value}>{formatPhone(data?.userPhone)}</Text>

                </View>
            </View>
  );
}

const styles = StyleSheet.create({

    container: {
    flex: 1,
    backgroundColor: '#fff',
    },

    content: {
        flex: 1,
        padding: 20,
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

    subtitle: {
        fontSize: 18,
        marginBottom: 8,
        marginLeft: 12,
        fontWeight: 'bold',
    },

    value: {
        width: '100%',
        minHeight: 50,
        fontSize: 16,
        backgroundColor: '#f2f2f2',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        color: '#000',
        textAlignVertical: 'center',
        textAlign: 'left',
        justifyContent: 'center',
        paddingTop: 15,
        fontWeight: '500'
  }
});
