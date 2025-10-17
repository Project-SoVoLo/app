import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from '../../api/axios';

export default function CardNewsDetail() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [role, setRole] = useState('');

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => setAuthToken(token));
    AsyncStorage.getItem('role').then(role => setRole(role ?? ''));
  }, []);

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);

    axios.get(`/api/card/${cardId}`)
      .then(res => {
        setCard(res.data.card);
        setBookmarked(Boolean(res.data.bookmarkedByMe));
        // console.log(res.data)
      })
      .catch(error => {
        Alert.alert('오류', '카드뉴스 상세 정보를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [cardId]);

  //북마크 토글
  const handleBookmark = async () => {
    if (!authToken) {
      Alert.alert('로그인 필요', '로그인 후 이용 바랍니다.');
      return;
    }

    try {
      const res = await axios.post(`/api/card/${cardId}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setBookmarked(prev => !prev);
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '북마크 처리 실패');
    }
  };


  const isAdmin = (role ?? '').toLowerCase() === 'admin';
  
  //카드뉴스 삭제
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/card/${cardId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      Alert.alert('삭제 완료', '카드뉴스가 삭제되었습니다.', [
        { text: '확인', onPress: () => router.replace('/cardnewslist') }
      ]);
    } catch (e) {
      Alert.alert('오류', e.response?.data?.message || '삭제 실패');
    }
    setOptionsVisible(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <Text>카드뉴스가 존재하지 않습니다.</Text>
        <Button title="뒤로가기" onPress={() => router.back()} />
      </View>
    );
  }

  return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ paddingBottom: 60 }}
        >
      <View style={styles.container}>

        {/* 삭제 버튼(관리자일 경우만 표시) */}
        {isAdmin && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setOptionsVisible(true)}>
              <MaterialIcons name="more-vert" size={26} color="#444" />
            </TouchableOpacity>
          </View>
        )}

        {/* 삭제 모달 */}
        <Modal
          visible={optionsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setOptionsVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPressOut={() => setOptionsVisible(false)}
          >
            <View style={styles.optionsModal}>
              <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                <MaterialIcons name="delete" size={21} color="#b44" />
                <Text style={styles.optionText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 북마크 버튼 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={handleBookmark}>
            <MaterialIcons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={28}
              color={bookmarked ? '#ffbb33' : '#888'}
            />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, marginLeft: 4 }}>
            {bookmarked ? '북마크됨' : '북마크'}
          </Text>
        </View>

        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.date}>{card.date?.slice(0, 10) ?? '-'}</Text>
        <Text style={styles.content}>{card.content}</Text>

        {card.thumbnailUrl && (
          <Image
            source={{ uri: card.thumbnailUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        {Array.isArray(card.imageUrls) && card.imageUrls.map((url, idx) => (
          <Image key={idx} source={{ uri: url }} style={styles.image} resizeMode="cover" />
        ))}

        <Button title="뒤로가기" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff' 
  },

  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  
  date: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 12 
  },

  content: { 
    fontSize: 16, 
    lineHeight: 22, 
    marginBottom: 6 
  },

  image: { 
    width: '100%', 
    height: 160, 
    borderRadius: 7, 
    marginBottom: 12 
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionsModal: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingVertical: 8,
    minWidth: 110,
    marginTop: 30,
    marginRight: 24,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  optionText: {
    fontSize: 15,
    marginLeft: 10,
    color: '#222',
  }

});
