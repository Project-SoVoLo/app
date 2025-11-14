import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from "dayjs";
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

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: '#f9fafc',
  backgroundGradientTo: '#f9fafc',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#f9fafc',
  },
  fillShadowGradient: '#3867d6',
  fillShadowGradientOpacity: 0.3,
  fromZero: true,
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

  const getChartDataForType = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return { labels: [], datasets: [  [] ] };
    }

    if (items.length === 1) {
    const mainDate = dayjs(items[0].diagnosisDate);
    const labels = [mainDate.subtract(1, 'day').format('MM.DD'), mainDate.format('MM.DD')];
    for (let i = 1; i < 7; i++) {
      labels.push(mainDate.add(i, 'day').format('MM.DD'));
    }
    const value = Number(items[0].diagnosisScore) || 0;
    const dataArr = [0, value, value, value, value, value, value, value];

    return {
      labels,
      datasets: [
        {
           data : dataArr,
          strokeWidth: 2,
        }
      ],
    };
  }


    const sorted = [...items].sort((a, b) => new Date(a.diagnosisDate) - new Date(b.diagnosisDate));
    const startDate = dayjs(sorted[0].diagnosisDate);
    const endDate = dayjs(sorted[sorted.length - 1].diagnosisDate);
    const totalDays = endDate.diff(startDate, 'day');
    const step = totalDays / (8 - 1);

    // 점수 매핑
    const scoreMap = {};
    sorted.forEach(item => {
      scoreMap[dayjs(item.diagnosisDate).format('YYYY.MM.DD')] = Number(item.diagnosisScore) || 0;
    });

    const labels = [];
    const dataArr = [];
    let lastScore = 0;

    for (let i = 0; i < 8; i++) {
      const currentDate = startDate.add(step * i, 'day').format('YYYY.MM.DD');
      labels.push(currentDate.slice(5));

      if (scoreMap.hasOwnProperty(currentDate)) {
        lastScore = scoreMap[currentDate];
        dataArr.push(lastScore);
      } else {
        dataArr.push(lastScore);
      }
    }

    return {
      labels,
      datasets: [
        {
            data : dataArr,
          strokeWidth: 2,
        }
      ],
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
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
                <View>
                  {items.map((item, index) => (
                    <View key={index} style={styles.itemBox}>
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

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 36,
    color: "#253858",
  },

  chartTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
    color: "#2c3e50",
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
