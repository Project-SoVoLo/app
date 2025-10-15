import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import axios from "../api/axios";

const screenWidth = Dimensions.get("window").width;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const regex = /^(\d{2})(\d{2})(-\d{2}-\d{2})$/;
  if (regex.test(dateStr)) {
    return dateStr.replace(regex, (match, p1, p2, p3) => `${p2}.${p3.slice(1).replace(/-/g, '.')}`);
  }
  return dateStr.slice(-8).replace(/-/g, '.');
};


export default function Condition() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      const token = await AsyncStorage.getItem('token');
      if (email) setUserEmail(email);
      if (token) setToken(token);
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    axios.get('/api/diagnosis/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => setData(res.data))
      .catch(() => Alert.alert("오류", "내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
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

  //차트 x축 라벨로 사용 (변환된 날짜)
  const allDates = useMemo(() => {
    if (!data) return [];
    const dateSet = new Set(data.map(item => formatDate(item.diagnosisDate)));
    return Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
  }, [data]);

  //차트 데이터 생성
  const getChartDataForType = (items) => {
    const scoreMap = {};
    items.forEach(item => {
      scoreMap[formatDate(item.diagnosisDate)] = Number(item.diagnosisScore) || 0;
    });

    const dataArr = allDates.map(date => scoreMap[date] ?? 0);
    return {
      labels: allDates,
      datasets: [
        {
          data : dataArr,
          strokeWidth: 2,
        }
      ]
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>호전상태 차트</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('../profile')}>
        <Text style={styles.backButtonText}>← 뒤로가기</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>이메일</Text>
          <Text style={styles.infoText}>{userEmail || '정보 없음'}</Text>
        </View>

        {loading && <Text>로딩중...</Text>}
        
        {
          data && data.length > 0
            ? Object.entries(groupedData).map(([type, items]) => (
                <View key={type} style={{ marginBottom: 30 }}>
                  <Text style={styles.chartTitle}>{type}</Text>
                  <LineChart
                    data={getChartDataForType(items)}
                    width={screenWidth-32}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        marginVertical: 8,
                        borderRadius: 16,
                      },
                      propsForLabels: {
                        fontSize: 8,
                      },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#fff',
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                  <View>
                    {items.map((item, index) => (
                      <View key={index} style={styles.itemBox}>
                        {/* 상세 부분은 원래 날짜 형식 그대로 표기 */}
                        <Text>날짜: {item.diagnosisDate}</Text>
                        <Text>점수: {item.diagnosisScore}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            : !loading && <Text>조회 가능한 내역이 없습니다.</Text>
        }
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    backgroundColor: "#ffff",
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

  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
