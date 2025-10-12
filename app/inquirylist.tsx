import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from './api/axios';

export default function InquiryList() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios.get('/api/inquiry/all')
      .then(res => {
        // console.log(res.data);
        const reversed = (res.data ?? []).slice().reverse(); 
      setNotices(reversed);
      })
      .catch(() => {
        Alert.alert('오류', '건의사항 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>건의사항 전체 목록</Text>
        
        <View style={styles.headerRow}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/community')}>
          <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/inquirywrite')}>
          <MaterialCommunityIcons name="plus" size={16} color="#000" />
        </TouchableOpacity>
        
        </View>
      
      {notices.length === 0 ? (
        <Text>건의사항이 없습니다.</Text>
      ) : (
        notices.map((item, idx) => (
        <TouchableOpacity
            key={item.inquiryId ?? idx}
            style={styles.noticeItem}
            onPress={() => router.push(`/inquirydetail?id=${item.id}`)}
        >
            <Text style={styles.noticeTitle}>{item.title}</Text>
            <Text style={styles.noticeDate}>{item.author}</Text>
        </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff' 
    },

  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 20
    },

  noticeItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    },

  noticeTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
    },

  noticeDate: { 
    marginTop: 4, 
    fontSize: 12, 
    color: '#666' 
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
    },


});
