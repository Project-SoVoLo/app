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
  const [inquiries, setInquiries] = useState([]);
  const [userEmail, setUserEmail] = useState(null);

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
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email);
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
          axios.get('/api/inquiry/all'),
          axios.get('/api/mypage/likes'),
          axios.get('/api/mypage/bookmarks'),
          axios.get('/api/card')
        ])
          .then(([postsRes, inquiryRes, likesRes, bookmarksRes, cardRes]) => {
            setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);

          const filteredInquiries = (Array.isArray(inquiryRes.data) ? inquiryRes.data : [])
            .filter(item => item.author === userEmail);
            setInquiries(filteredInquiries);
            //좋아요 목록 최신순 정렬
            const sortedLikes = (Array.isArray(likesRes.data) ? likesRes.data : []).sort((a, b) => {
              const aDate = new Date(a.date || a.createdAt);
              const bDate = new Date(b.date || b.createdAt);
              return bDate - aDate;
            });
            setLikes(sortedLikes);
            // console.log('likesRes:', likesRes.data);
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
            setInquiries([]);
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

            <TouchableOpacity onPress={() => router.push('/inquirylist')}>
              <Text style={styles.subSectionTitle}>건의사항</Text>
            </TouchableOpacity>
            {isLoggedIn ? (
              role === 'ADMIN' ? (
                <Text>관리자는 작성한 글을 볼 수 없습니다.</Text>
              ) : inquiries.length > 0 ? (
                inquiries.map((item, idx) => (
                  <TouchableOpacity
                    style={styles.postItem}
                    key={item.id ?? idx}
                    onPress={() => router.push(`/inquirydetail?id=${item.id}`)}
                  >
                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text style={styles.postUser}>{item.date || item.createdAt}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text>작성한 건의사항이 없습니다.</Text>
              )
            ) : (
              <Text>글을 보려면 로그인이 필요합니다.</Text>
            )}

            <TouchableOpacity onPress={() => router.push('/communitylist')}>
              <Text style={styles.subSectionTitle}>커뮤니티</Text>
            </TouchableOpacity>
            {isLoggedIn ? (
              role === 'ADMIN' ? (
                <Text>관리자는 작성한 글을 볼 수 없습니다.</Text>
              ) : posts.length > 0 ? (
                posts.map((item, idx) => (
                  <TouchableOpacity
                    style={styles.postItem}
                    key={item.id ?? idx}
                    onPress={() => router.push(`/communitydetail?id=${item.id}`)}
                  >
                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text style={styles.postUser}>{item.date}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text>작성한 글이 없습니다.</Text>
              )
            ) : (
              <Text>글을 보려면 로그인이 필요합니다.</Text>
            )}
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
                height={280}
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
    paddingTop: 24,
    paddingBottom: 20, 
  },
  contentBox: { 
    flex: 0, 
    width: "92%", 
    borderRadius: 16, 
    paddingBottom: 16, 
    backgroundColor: "#fff",
    elevation: 5,
  },
  sectionBox: { 
    width: "100%", 
    backgroundColor: "#f4f6fb", 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 28,
    shadowColor: "#a3c4f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 10, 
    color: "#2c3e50",
    letterSpacing: 0.3,
  },
  postItem: { 
    backgroundColor: "#fff", 
    padding: 14, 
    marginVertical: 6, 
    borderRadius: 12, 
    alignItems: "flex-start", 
    width: "100%", 
    shadowColor: "#b0c4de",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  postTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#34495e", 
    marginBottom: 4,
  },
  postUser: { 
    fontSize: 13, 
    color: "#95a5a6", 
  },
  cardNewsItem: {
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 6,
    borderRadius: 14,
    alignItems: "flex-start",
    width: "92%",
    shadowColor: "#b0c4de",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 5,
  },
  cardImage: { 
    width: "100%", 
    height: 200, 
    borderRadius: 14, 
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
  },
  cardDate: { 
    fontSize: 13, 
    color: "#7f8c8d" 
  },
  subSectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginTop: 14, 
    marginBottom: 6,
    color: '#34495e',
  },
});

//포춘쿠키 스타일
const fortuneStyles = StyleSheet.create({
  fortuneBtn: {
    flexDirection: "row",
    backgroundColor: "#4a90e2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    width: "92%",
    alignSelf: "center",
    shadowColor: "#3a72c4",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 7,
  },
  fortuneBtnImg: { 
    width: 32, 
    height: 32, 
    marginRight: 12 
  },
  fortuneBtnText: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#fff",
    letterSpacing: 0.7,
  },

  modalWrap: {
    flex: 1, 
    backgroundColor: "rgba(20,20,20,0.5)",
    alignItems: "center", 
    justifyContent: "center"
  },
  popupBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28, 
    minWidth: 280,
    alignItems: "center",
    shadowColor: "#0d47a1",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#34495e", 
    marginBottom: 28,
  },
  cookieRow: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    width: "100%",
  },
  cookie: { 
    marginHorizontal: 8,
    shadowColor: "#5271ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  cookieImg: { 
    width: 52, 
    height: 52, 
  },
  messageBox: { 
    alignItems: "center", 
    paddingTop: 22 
  },
  fortuneMsg: { 
    fontSize: 20, 
    color: "#34495e", 
    textAlign: "center", 
    marginBottom: 26, 
    fontWeight: "700" 
  },
  confirmBtn: { 
    backgroundColor: "#4a90e2", 
    borderRadius: 12, 
    paddingVertical: 16, 
    width: 140, 
    alignItems: "center",
    shadowColor: "#2562cb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 9,
  },
  confirmText: { 
    color: "#ffffff", 
    fontWeight: "700", 
    fontSize: 17,
    letterSpacing: 0.7,
  }
});

