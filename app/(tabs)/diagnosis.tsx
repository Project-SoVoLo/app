import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import axios from "../api/axios.js";


const typeMeta = {
  DEPRESSION: "우울",
  ANXIETY: "불안",
  EARLY_PSYCHOSIS: "조기정신증",
  BIPOLAR: "조울증",
  STRESS: "스트레스",
  INSOMNIA: "불면",
  ALCOHOL: "알코올중독",
  DEVICE_ADDICTION: "스마트기기 중독",
};

const selfCheckItems = Object.keys(typeMeta);

const answerLabels = [
  "전혀 아니다",
  "그렇지 않다",
  "보통이다",
  "그렇다",
  "매우 그렇다",
];

export default function SelfCheck() {
  const [selectedType, setSelectedType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
        } else {
          Alert.alert("인증 오류", "로그인이 필요합니다.");
          router.replace('/login');
        }
      } catch (e) {
        Alert.alert("오류", "토큰을 불러오는 데 실패했습니다.");
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!selectedType || !token) return;

    setLoading(true);
    axios.get(`/api/diagnosis/questions/${selectedType}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        setQuestions(res.data);
        setAnswers({});
      })
      .catch(err => {
        Alert.alert("오류", "문항을 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedType, token]);

  const handleAnswer = (questionIndex, answerValue) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerValue }));
  };

  //답변제출
  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      Alert.alert("알림", "모든 문항에 답변해 주세요.");
      return;
    }

    try {
      const response = await axios.post(
        "/api/diagnosis",
        {
          type: selectedType,
          answers: questions.map((q, idx) => answers[idx])
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      Alert.alert(
        "제출 완료",
        `자가진단이 제출되었습니다.\n점수: ${response.data.diagnosisScore}`,
        [{ text: "확인", onPress: () => setSelectedType(null) }]
      );
    } catch (err) {
      Alert.alert("오류", "제출에 실패했습니다.");
    }
  };

  //진단목록
  if (!selectedType) {
    return (
      <View style={styles.container}>
        {selfCheckItems.map(itemKey => (
          <TouchableOpacity
            key={itemKey}
            style={styles.item}
            onPress={() => setSelectedType(itemKey)}
          >
            <Text style={styles.itemText}>{typeMeta[itemKey]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  //질문
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{typeMeta[selectedType]} 자가진단 문항</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => setSelectedType(null)}>
        <Text style={styles.backButtonText}>← 뒤로가기</Text>
      </TouchableOpacity>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.questionsContainer}>
            {questions.map((q, idx) => (
              <View key={q.id} style={styles.questionBox}>
                <Text style={styles.questionText}>{q.number}. {q.questionText}</Text>
                <View style={styles.answerRow}>
                  {answerLabels.map((label, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.answerButton}
                      onPress={() => handleAnswer(idx, i + 1)}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          answers[idx] === (i + 1) && styles.radioOuterSelected,
                        ]}
                      >
                        {answers[idx] === (i + 1) && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.answerLabel}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>제출</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    item: {
        backgroundColor: "#f2f2f2",
        height: 44,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 6,
        marginBottom: 15,
    },
    itemText: {
        fontSize: 18,
        color: "#000",
        fontWeight: "500",
    },
    backButton: {
        marginBottom: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: "#000",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
        color: "#000",
    },
    questionsContainer: {
        paddingBottom: 10,
    },
    questionBox: {
        backgroundColor: "#f2f2f2",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    questionText: {
        fontSize: 15,
        color: "#000",
        marginBottom: 12,
    },
    answerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    answerButton: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 2,
        flex: 1,
        paddingHorizontal: 0,
    },
    answerLabel: {
        fontSize: 10,
        color: "#000",
        flexShrink: 1,
    },
    radioOuter: {
        width: 12,
        height: 12,
        borderRadius: 10,
        borderWidth: 1.2,
        borderColor: "#bbb",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 6,
    },
    radioOuterSelected: {
        borderColor: "#000",
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 6,
        backgroundColor: "#000",
    },
    submitButton: {
        backgroundColor: "#f2f2f2",
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    submitButtonText: {
        fontWeight: "700",
        fontSize: 18,
        color: "#000",
    },
});
