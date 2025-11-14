import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import axios from "../api/axios";


const WHISPER_API_URL = "http://192.168.0.102:5002/api/whisper";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationPhase, setConversationPhase] = useState("waiting_start");
  
  const [recording, setRecording] = useState(null); 
  const [whisperRecording, setWhisperRecording] = useState(false);
  const alertShown = useRef(false);
  const [token, setToken] = useState(null); 
  const router = useRouter();
  const flatListRef = useRef(null);
  
  useFocusEffect(
    useCallback(() => {
      const checkLoginStatus = async () => {
        if (alertShown.current) {
          return;
        }
        const userToken = await AsyncStorage.getItem('token');
        setToken(userToken);
        if (!userToken) {
          alertShown.current = true;
          Alert.alert(
            "인증 오류", 
            "로그인이 필요합니다.",
            [
              { text: "확인", onPress: () => router.replace('/login') }
            ]
          );
        }
      };
      checkLoginStatus();
      return () => {
        alertShown.current = false;
      };
    }, [router])
  );

  useEffect(() => {
    setMessages([{ id: generateUniqueId(), from: "bot", text: "대화를 시작합니다. 안녕이라고 말해보세요!" }]);
    
    //페이지 로드 시 마이크 권한 요청
    Audio.requestPermissionsAsync();
  }, []);
  
  //고유 ID 생성 함수 (key 중복 문제 해결)
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim()) return;

    const userMsg = { id: generateUniqueId(), from: "user", text: textToSend };
    setMessages(prev => [userMsg, ...prev]);
    setInput("");
    setLoading(true);

    let apiUrl = "";
    let nextPhase = conversationPhase;

    if (conversationPhase === "waiting_start") {
      apiUrl = "/api/chatbot/start-chat";
      nextPhase = "started";
    } else if (conversationPhase === "started") {
      apiUrl = "/api/chatbot/full";
      nextPhase = "ongoing";
    } else {
      apiUrl = "/api/chatbot/continue";
    }
    
    try {
      //API 요청 시 사용자 식별자가 필요하면 추가 (예: AsyncStorage에서 가져오기)
      const res = await axios.post(apiUrl, { text: textToSend, sender: "userEmail" });
      const rasaResponses = res.data.response;

      const botMessages = (Array.isArray(rasaResponses)
        ? rasaResponses.map((msg) => ({
            id: generateUniqueId(),
            from: "bot",
            text: msg.text || "",
            action: msg.metadata?.action_name || null,
          }))
        : [{ id: generateUniqueId(), from: "bot", text: rasaResponses || "챗봇 응답 없음" }]
      ).reverse(); //FlatList inverted 속성 때문에 배열을 뒤집어 순서대로 추가

      setMessages(prev => [...botMessages, ...prev]);
      setConversationPhase(nextPhase);

      if (isEndAction(botMessages)) {
        await saveChatSummary([userMsg, ...botMessages]);
      }
    } catch (err) {
      const errorMsg = { id: generateUniqueId(), from: "bot", text: "서버 응답에 실패했습니다." };
      setMessages(prev => [errorMsg, ...prev]);
      // console.error("API Error:", err);
    }
    setLoading(false);
  };
  
  const isEndAction = (responses) => {
    return responses.some(
      (res) =>
        res.action === "utter_end_chat_positive" ||
        res.action === "utter_end_chat_neutral" ||
        res.action === "utter_end_chat_negative"
    );
  };

  const saveChatSummary = async (finalMessages) => {
    const chatLog = finalMessages
      .map((msg) => `${msg.from === "user" ? "나" : "챗봇"}: ${msg.text}`)
      .join("\n");
    try {
      await axios.post("/api/mypage/chat-summaries", { chatLog });
      console.log("✅ 대화 요약 저장 완료");
    } catch (err) {
      console.error("❌ 요약 저장 실패", err);
    }
  };

  const handleWhisperToggle = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('마이크 사용 권한이 필요합니다.');
      return;
    }

    if (whisperRecording) {
      setWhisperRecording(false);
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('녹음 중지. 파일 URI:', uri);
        await sendAudioToServer(uri);
        setRecording(null);
      } catch (error) {
        console.error("녹음 중지 실패", error);
      }
    } else {
      try {
        setWhisperRecording(true);
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });
        
        const { recording: newRecording } = await Audio.Recording.createAsync(
           Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        console.log('녹음 시작');
      } catch (err) {
        console.error('녹음 시작 실패', err);
        setWhisperRecording(false);
      }
    }
  };

  //오디오 파일 서버 전송
  const sendAudioToServer = async (uri) => {
    if (!uri) {
      console.error("오디오 파일 URI가 없습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", {
      uri: uri,
      type: 'audio/m4a', //expo-av로 녹음된 형식 :m4a
      name: 'recording.m4a',
    });

    try {
      const response = await axios.post(WHISPER_API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;
      if (data.text) {
        setInput(prev => (prev ? prev + " " : "") + data.text);
      } else {
        alert(data.error || "음성 인식에 실패했습니다.");
      }
    } catch (err) {
      alert("Whisper 서버에 연결할 수 없습니다.");
      console.error("Whisper API Error:", err);
    }
  };
  
  const renderMessageItem = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.from === "user" ? styles.userBubble : styles.botBubble
    ]}>
      <Text style={item.from === "user" ? styles.userText : styles.botText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={35}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        style={styles.messagesArea}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingVertical: 10 }}
        renderItem={renderMessageItem}
      />

      {loading && (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>챗봇이 답변을 작성 중입니다...</Text>
          </View>
      )}

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.voiceBtn} onPress={handleWhisperToggle}>
          {whisperRecording
            ? <Ionicons name="stop-circle" size={28} color="#d32f2f" />
            : <Ionicons name="mic-outline" size={28} color="#666" />
          }
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={"#999999"}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          editable={!whisperRecording}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messagesArea: {
    flex: 1,
    paddingHorizontal: 14,
    marginTop: 22,
  },

  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 12,
    maxWidth: '78%',
    shadowColor: '#a3c4f3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  
  botBubble: {
    backgroundColor: "#f4f6fb",
    alignSelf: "flex-start",
  },

  userText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },

  botText: {
    color: "#1c1c1e",
    fontSize: 16,
    lineHeight: 22,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 80,
  },

  voiceBtn: {
    padding: 10,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 30,
    shadowColor: '#00000025',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    backgroundColor: "#fff",
    marginRight: 10,
    fontSize: 16,
    color: '#222',
    shadowColor: '#babcc0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  sendBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 24,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005ec4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  loadingText: {
    marginLeft: 12,
    color: '#555',
    fontSize: 15,
  },
});
