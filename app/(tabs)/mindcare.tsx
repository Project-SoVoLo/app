import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from '../api/axios';


export default function MindCare() {
  const [location, setLocation] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);

  //위치 권한, 위치 정보
  const getLocationAndFetchCenters = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한 필요', '기능을 사용하려면 위치 권한이 필요합니다.');
      setLoading(false);
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});

    // console.log('위치:',loc.coords.latitude, loc.coords.longitude);

    setLocation(loc.coords);
    fetchCenters(loc.coords.latitude, loc.coords.longitude);
  };

//병원 정보 api
const fetchCenters = async (latitude, longitude) => {
  try {
    const url = `/api/center?lat=${latitude}&lng=${longitude}`;
    // console.log('요청 API:', url); //경로 확인용
    const res = await axios.get(url);
    setCenters(Array.isArray(res.data) ? res.data : []);
    // console.log(res.data);
  } catch (error) {
    Alert.alert('오류', '센터 정보를 불러올 수 없습니다.');
    setCenters([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    getLocationAndFetchCenters();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>주변 병원/치료센터 위치 안내</Text>

      {loading ? (
  <Text style={styles.loadingText}>불러오는 중...</Text>
) : (
  <>
    {location && (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={location} title="내 위치" pinColor="blue" />
        {centers.map((center, idx) => (
          <Marker
            key={idx}
            coordinate={{ latitude: center.lat, longitude: center.lng }}
            title={center.name}
            description={center.category}
          />
        ))}
      </MapView>
    )}

    {centers.length > 0 ? (
      centers.map((item, idx) => (
        <View key={idx} style={styles.centerItem}>
          <Text style={styles.centerName}>{item.name}</Text>
          <Text style={styles.centerInfo}>주소: {item.address}</Text>
          <Text style={styles.centerInfo}>거리: {item.distance}km</Text>
          <Text style={styles.centerInfo}>전화번호: {item.phone}</Text>
          <Text style={styles.centerInfo}>분류: {item.category}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.noResult}>주변에 센터 정보가 없습니다.</Text>
    )}
  </>
)}


      {/* 수동 리로드 버튼 */}
      <TouchableOpacity style={styles.reloadButton} onPress={getLocationAndFetchCenters}>
        <Text style={styles.reloadButtonText}>위치 새로고침</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 24, 
    backgroundColor: '#fff', 
    flexGrow: 1,
  },

  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: 20, 
    color: '#2c3e50' 
  },

  loadingText: { 
    fontSize: 16, 
    marginVertical: 14, 
    color: '#6c7a93', 
    alignSelf: 'center',
  },
  
  noResult: { 
    fontSize: 16, 
    marginVertical: 14, 
    color: '#95a1b5', 
    alignSelf: 'center',
    fontStyle: 'italic',
  },
  
  centerItem: { 
    backgroundColor: '#f4f6fb', 
    borderRadius: 16, 
    marginBottom: 18, 
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#a3c4f3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  
  centerName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#3758a3', 
    marginBottom: 6 
  },
  
  centerInfo: { 
    fontSize: 14, 
    color: '#374151', 
    marginBottom: 4 
  },

  reloadButton: { 
    marginTop: 24, 
    alignSelf: 'center', 
    backgroundColor: '#3b68d6', 
    paddingVertical: 14, 
    paddingHorizontal: 28, 
    borderRadius: 12, 
    marginBottom: 100,
    shadowColor: '#2a4aa1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },

  reloadButtonText: { 
    color: '#f4f7fc', 
    fontWeight: '700', 
    fontSize: 17, 
  },
  
  map: {
    width: '100%',
    height: 220,
    marginBottom: 20,
    borderRadius: 16,
  },
});
