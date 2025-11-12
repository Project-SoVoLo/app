import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import { Alert, DeviceEventEmitter, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Carousel from 'react-native-reanimated-carousel';
import axios from '../../api/axios';

const { width: screenWidth } = Dimensions.get('window');

//포춘쿠키 메시지
const fortuneMessages = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10"
];

//포춘쿠키 이미지
const fortuneCookieImage = "https://cdn-icons-png.flaticon.com/512/1046/1046857.png";

//포춘쿠키 이벤트 컴포넌트
function FortuneCookieEvent({ visible, onClose }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [pickedMsg, setPickedMsg] = useState("");
  const [cookies, setCookies] = useState([]);

  useEffect(() => {
    if (visible) {
      setSelectedIdx(null);
      setPickedMsg("");
      setCookies(Array.from({ length: 5 }).map(
        () => Math.floor(Math.random() * fortuneMessages.length)
      ));
    }
  }, [visible]);

  const handlePick = (idx) => {
    setSelectedIdx(idx);
    setPickedMsg(fortuneMessages[cookies[idx]]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={fortuneStyles.modalWrap}>
        <View style={fortuneStyles.popupBox}>
          <Text style={fortuneStyles.title}>포춘쿠키를 골라보세요!</Text>
          {!pickedMsg ? (
            <View style={fortuneStyles.cookieRow}>
              {cookies.map((msgIdx, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handlePick(i)}
                  style={fortuneStyles.cookie}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: fortuneCookieImage }} style={fortuneStyles.cookieImg} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={fortuneStyles.messageBox}>
              <Text style={fortuneStyles.fortuneMsg}>{pickedMsg}</Text>
              <TouchableOpacity style={fortuneStyles.confirmBtn} onPress={onClose}>
                <Text style={fortuneStyles.confirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function MainPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [cardNews, setCardNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const router = useRouter();

  // 포춘쿠키 팝업 상태
  const [fortunePopup, setFortunePopup] = useState(false);

  // AsyncStorage 확인용
  useEffect(() => {
    const printAllStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        if (keys.length === 0) {
          console.log('AsyncStorage: 없음');
          return;
        }
        const items = await AsyncStorage.multiGet(keys);
        items.forEach(([key, value]) => {
          console.log(`${key}: ${value !== null ? value : 'null'}`);
        });
      } catch (e) {
        console.error('AsyncStorage 오류:', e);
      }
    };
    printAllStorage();
  }, []);

  // 로그인 상태 체크 및 이벤트 구독
  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('role');
      setRole(role);
      setIsLoggedIn(!!token);
    };

    checkLogin();

    const loginListener = DeviceEventEmitter.addListener('loginStateChange', checkLogin);
    return () => loginListener.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      if (isLoggedIn && role !== 'ADMIN') {
        Promise.all([
          axios.get('/api/mypage/community-posts'),
          axios.get('/api/mypage/likes'),
          axios.get('/api/mypage/bookmarks'),
          axios.get('/api/card')
        ])
          .then(([postsRes, likesRes, bookmarksRes, cardRes]) => {
            setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
            //좋아요 목록 최신순 정렬
            const sortedLikes = (Array.isArray(likesRes.data) ? likesRes.data : []).sort((a, b) => {
              const aDate = new Date(a.date || a.createdAt);
              const bDate = new Date(b.date || b.createdAt);
              return bDate - aDate;
            });
            setLikes(sortedLikes);
            //북마크 목록 최신순 정렬
            const communityBookmarks = (Array.isArray(bookmarksRes.data) ? bookmarksRes.data : [])
              .filter(item => item.blocks && item.blocks !== null)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const cardNewsBookmarks = (Array.isArray(bookmarksRes.data) ? bookmarksRes.data : [])
              .filter(item => !item.blocks || item.blocks === null)
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            setBookmarks([...communityBookmarks, ...cardNewsBookmarks]);
            //카드뉴스 최신순 정렬, 3개 표시
            const sortedCardNews = Array.isArray(cardRes.data)
              ? [...cardRes.data].sort((a, b) => new Date(b.date) - new Date(a.date))
              : [];
            setCardNews(sortedCardNews.slice(0, 3));
            // console.log('cardsRes:', cardRes.data);
          })
          .catch(() => {
            Alert.alert('오류', '정보를 불러오지 못했습니다.');
            setPosts([]);
            setLikes([]);
            setBookmarks([]);
            setCardNews([]);
          })
          .finally(() => setLoading(false));
      } else { // 비로그인 또는 관리자
        axios.get('/api/card')
          .then(cardRes => {
            const sortedCardNews = Array.isArray(cardRes.data)
              ? [...cardRes.data].sort((a, b) => new Date(b.date) - new Date(a.date))
              : [];
            setCardNews(sortedCardNews.slice(0, 3));
          })
          .catch(() => {
            Alert.alert('오류', '카드뉴스 정보를 불러오지 못했습니다.');
            setCardNews([]);
          })
          .finally(() => setLoading(false));
        setPosts([]);
        setLikes([]);
        setBookmarks([]);
      }
    }, [isLoggedIn, role])
  );

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
        {/* 포춘쿠키 버튼 */}
        <TouchableOpacity
          style={fortuneStyles.fortuneBtn}
          onPress={() => setFortunePopup(true)}
          activeOpacity={0.85}
        >
          <Image source={{ uri: fortuneCookieImage }} style={fortuneStyles.fortuneBtnImg} />
          <Text style={fortuneStyles.fortuneBtnText}>오늘의 행운 뽑기</Text>
        </TouchableOpacity>
        <FortuneCookieEvent visible={fortunePopup} onClose={() => setFortunePopup(false)} />


        <View style={styles.contentBox}>
          {/* 내가 작성한 글 */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>내가 작성한 글</Text>
            {isLoggedIn
              ? (role === 'ADMIN' ? (
                <Text>관리자는 작성한 글을 볼 수 없습니다.</Text>
              ) : posts.length > 0
                ? posts.map((item, idx) => (
                  <TouchableOpacity
                    style={styles.postItem}
                    key={item.id ?? idx}
                    onPress={() => router.push(`/communitydetail?id=${item.id}`)}
                  >
                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text style={styles.postUser}>{item.date}</Text>
                  </TouchableOpacity>
                ))
                : <Text>작성한 글이 없습니다.</Text>
              )
              : <Text>작성한 글을 보려면 로그인이 필요합니다.</Text>
            }
          </View>
          
          {/* 좋아요 목록 */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>좋아요 목록</Text>
            {isLoggedIn
              ? (role === 'ADMIN' ? (
                <Text>관리자는 좋아요한 글을 볼 수 없습니다.</Text>
              ) : (
                <>
                  <TouchableOpacity onPress={() => router.push('/noticelist')}>
                    <Text style={styles.subSectionTitle}>공지사항</Text>
                  </TouchableOpacity>
                  {likes.filter(item => !item.hasOwnProperty('blocks') || item.blocks === null).length > 0 ? (
                    likes.filter(item => !item.hasOwnProperty('blocks') || item.blocks === null).map((item, idx) => (
                      <TouchableOpacity
                        style={styles.postItem}
                        key={`notice-${item.id ?? item.postId ?? idx}`}
                        onPress={() => router.push(`/noticedetail?postId=${item.postId ?? item.id}`)}
                      >
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <Text style={styles.postUser}>{item.date || item.createdAt}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text>좋아요한 공지사항 글이 없습니다.</Text>
                  )}
                  <TouchableOpacity onPress={() => router.push('/communitylist')}>
                    <Text style={styles.subSectionTitle}>커뮤니티</Text>
                  </TouchableOpacity>
                  {likes.filter(item => item.hasOwnProperty('blocks') && item.blocks !== null).length > 0 ? (
                    likes.filter(item => item.hasOwnProperty('blocks') && item.blocks !== null).map((item, idx) => (
                      <TouchableOpacity
                        style={styles.postItem}
                        key={`community-${item.id ?? item.postId ?? idx}`}
                        onPress={() => router.push(`/communitydetail?id=${item.id ?? item.postId}`)}
                      >
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <Text style={styles.postUser}>{item.date || item.createdAt}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text>좋아요한 커뮤니티 글이 없습니다.</Text>
                  )}
                </>
              ))
              : <Text>좋아요한 글을 보려면 로그인이 필요합니다.</Text>
            }
          </View>

          {/* 북마크 목록 */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>북마크 목록</Text>
            {isLoggedIn ? (
              role === 'ADMIN' ? (
                <Text>관리자는 북마크한 글을 볼 수 없습니다.</Text>
              ) : (
                <>
                  <TouchableOpacity onPress={() => router.push('/communitylist')}>
                    <Text style={styles.subSectionTitle}>커뮤니티</Text>
                  </TouchableOpacity>
                  {bookmarks.filter(item => item.blocks && item.blocks !== null).length > 0 ? (
                    bookmarks.filter(item => item.blocks && item.blocks !== null).map((item, idx) => (
                      <TouchableOpacity
                        style={styles.postItem}
                        key={`community-${item.id ?? item.postId ?? idx}`}
                        onPress={() => router.push(`/communitydetail?id=${item.id ?? item.postId}`)}
                      >
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <Text style={styles.postUser}>{item.date || item.createdAt}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text>커뮤니티 글 북마크가 없습니다.</Text>
                  )}
                  <TouchableOpacity onPress={() => router.push('/cardnewslist')}>
                    <Text style={styles.subSectionTitle}>카드뉴스</Text>
                  </TouchableOpacity>
                  {bookmarks.filter(item => !item.blocks || item.blocks === null).length > 0 ? (
                    bookmarks.filter(item => !item.blocks || item.blocks === null).map((item, idx) => (
                      <TouchableOpacity
                        style={styles.postItem}
                        key={`cardnews-${item.id ?? item.postId ?? idx}`}
                        onPress={() => router.push(`/cardnewsdetail?cardId=${item.id ?? item.postId}`)}
                      >
                        <Text style={styles.postTitle}>{item.title}</Text>
                        <Text style={styles.postUser}>{item.date}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text>카드뉴스 글 북마크가 없습니다.</Text>
                  )}
                </>
              )
            ) : (
              <Text>북마크한 글을 보려면 로그인이 필요합니다.</Text>
            )}
          </View>

          {/* 카드뉴스 목록 */}
          <View style={styles.sectionBox}>
            <TouchableOpacity onPress={() => router.push('/cardnewslist')}>
              <Text style={styles.sectionTitle}>카드뉴스 목록</Text>
            </TouchableOpacity>
            {cardNews.length > 0 ? (
              <Carousel
                width={screenWidth * 0.9}
                height={170}
                data={cardNews}
                mode="horizontal-stack"
                modeConfig={{ snapDirection: 'left' }}
                scrollAnimationDuration={500}
                loop
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    key={item.id ?? index}
                    style={styles.cardNewsItem}
                    onPress={()=> router.push(`/cardnewsdetail?cardId=${item.postId}`)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.cardImage} />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{item.date}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text>카드뉴스가 없습니다.</Text>
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
    backgroundColor: "#fff", 
    alignItems: "center",
    paddingTop: 20
  },
  contentBox: { 
    flex: 0, width: "90%", 
    borderRadius: 12, 
    paddingBottom: 8, 
    elevation: 1 
  },
  sectionBox: { 
    width: "100%", 
    backgroundColor: "#f2f2f2", 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 30 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginTop: 4, 
    marginBottom: 6, 
    marginLeft: 4, 
    color: "#000" 
  },
  CardSectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginTop: 4, 
    marginBottom: 10, 
    marginLeft: 4, 
    color: "#000" 
  },
  postItem: { 
    backgroundColor: "#fff", 
    padding: 11, 
    marginVertical: 5, 
    borderRadius: 8, 
    alignItems: "flex-start", 
    width: "99%", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 2, 
    elevation: 2 
  },
  postTitle: { 
    fontSize: 14, 
    fontWeight: "bold", 
    color: "#222", 
    marginBottom: 3 
  },
  postUser: { 
    fontSize: 12, 
    color: "#666" 
  },
  cardNewsItem: {
    backgroundColor: "#fff",
    padding: 11,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: "flex-start",
    width: "93%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cardImage: { 
    width: "100%", 
    height: 90, 
    borderRadius: 12, 
    marginBottom: 8 
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  cardDate: { 
    fontSize: 12, 
    color: "#666" 
  },
  subSectionTitle: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    marginTop: 12, 
    marginBottom: 4,
    marginLeft: 4, 
    color: '#1a1a1a' 
  }
});

// 포춘쿠키 스타일 추가
const fortuneStyles = StyleSheet.create({

  fortuneBtn: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: "90%",
    alignSelf: "center"
  },
  fortuneBtnImg: { 
    width: 30, 
    height: 30, 
    marginRight: 8 
  },

  fortuneBtnText: { 
    fontSize: 17, 
    fontWeight: "bold", 
    color: "#000" 
  },

  modalWrap: {
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", 
    justifyContent: "center"
  },

  popupBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24, 
    minWidth: 270,
    alignItems: "center",
  },

  title: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#000", 
    marginBottom: 26 
  },
  
  cookieRow: { 
    flexDirection: "row", 
    justifyContent: "center", 
    gap: 10, 
    marginTop: 10 
  },
  
  cookie: { 
    marginHorizontal: 5 
  },
  
  cookieImg: { 
    width: 48, 
    height: 48 
  },

  messageBox: { 
    alignItems: "center", 
    paddingTop: 18 
  },

  fortuneMsg: { 
    fontSize: 18, 
    color: "#000", 
    textAlign: "center", 
    marginBottom: 24, 
    fontWeight: "bold" 
  },

  confirmBtn: { 
    backgroundColor: "#f2f2f2", borderRadius: 8, padding: 14, width: 120, alignItems: "center" },
  
  confirmText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 16 
  }
});
