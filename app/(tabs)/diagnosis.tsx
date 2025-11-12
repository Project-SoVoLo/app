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

const choicesMap = {
  DEPRESSION: {
    1: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    2: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    3: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    4: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    5: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    6: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    7: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    8: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
    9: [{ label: "없음", score: 0 }, { label: "2~6일", score: 1 }, { label: "7~12일", score: 2 }, { label: "거의 매일", score: 3 }],
  },
  ANXIETY: {
    1: [{ label: "전혀 방해 받지 않았다.", score: 0 }, { label: "며칠 동안 방해 받았다.", score: 1 }, { label: "2주 중 절반이상 방해 받았다.", score: 2 }, { label: "거의 매일 방해 받았다.", score: 3 }],
    2: [{ label: "전혀 방해 받지 않았다.", score: 0 }, { label: "며칠 동안 방해 받았다.", score: 1 }, { label: "2주 중 절반이상 방해 받았다.", score: 2 }, { label: "거의 매일 방해 받았다.", score: 3 }],
    3: [{ label: "전혀 방해 받지 않았다.", score: 0 }, { label: "며칠 동안 방해 받았다.", score: 1 }, { label: "2주 중 절반이상 방해 받았다.", score: 2 }, { label: "거의 매일 방해 받았다.", score: 3 }],
    4: [{ label: "전혀 방해 받지 않았다.", score: 0 }, { label: "며칠 동안 방해 받았다.", score: 1 }, { label: "2주 중 절반이상 방해 받았다.", score: 2 }, { label: "거의 매일 방해 받았다.", score: 3 }],
    5: [{ label: "전혀 방해 받지 않았다.", score: 0 }, { label: "며칠 동안 방해 받았다.", score: 1 }, { label: "2주 중 절반이상 방해 받았다.", score: 2 }, { label: "거의 매일 방해 받았다.", score: 3 }],
    6: [{ label: "전혀 방해 받지 않았다.", score: 0 }, { label: "며칠 동안 방해 받았다.", score: 1 }, { label: "2주 중 절반이상 방해 받았다.", score: 2 }, { label: "거의 매일 방해 받았다.", score: 3 }],
    7: [{ label: "전혀 방해 받지 않았다.", score: 0 }, { label: "며칠 동안 방해 받았다.", score: 1 }, { label: "2주 중 절반이상 방해 받았다.", score: 2 }, { label: "거의 매일 방해 받았다.", score: 3 }],
  },
  EARLY_PSYCHOSIS: {
    1: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    2: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    3: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    4: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    5: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    6: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    7: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    8: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    9: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    10: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    11: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    12: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    13: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    14: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    15: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    16: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    17: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    18: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    19: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
  },
  BIPOLAR: {
    1: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    2: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    3: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    4: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    5: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    6: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    7: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    8: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    9: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    10: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    11: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    12: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    13: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
    14: [{ label: "예", score: 1 }, { label: "아니오", score: 0 }],
  },
  STRESS: {
    1: [{ label: "전혀없음", score: 0 }, { label: "거의없음", score: 1 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 3 }, { label: "매우 자주있음", score: 4 }],
    2: [{ label: "전혀없음", score: 0 }, { label: "거의없음", score: 1 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 3 }, { label: "매우 자주있음", score: 4 }],
    3: [{ label: "전혀없음", score: 0 }, { label: "거의없음", score: 1 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 3 }, { label: "매우 자주있음", score: 4 }],
    4: [{ label: "전혀없음", score: 4 }, { label: "거의없음", score: 3 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 1 }, { label: "매우 자주있음", score: 0 }],
    5: [{ label: "전혀없음", score: 4 }, { label: "거의없음", score: 3 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 1 }, { label: "매우 자주있음", score: 0 }],
    6: [{ label: "전혀없음", score: 0 }, { label: "거의없음", score: 1 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 3 }, { label: "매우 자주있음", score: 4 }],
    7: [{ label: "전혀없음", score: 4 }, { label: "거의없음", score: 3 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 1 }, { label: "매우 자주있음", score: 0 }],
    8: [{ label: "전혀없음", score: 4 }, { label: "거의없음", score: 3 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 1 }, { label: "매우 자주있음", score: 0 }],
    9: [{ label: "전혀없음", score: 0 }, { label: "거의없음", score: 1 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 3 }, { label: "매우 자주있음", score: 4 }],
    10:[{ label: "전혀없음", score: 0 }, { label: "거의없음", score: 1 }, { label: "때때로 있음", score: 2 }, { label: "자주있음", score: 3 }, { label: "매우 자주있음", score: 4 }],
  },
  INSOMNIA: {
    1: [{ label: "전혀 없음", score: 0 }, { label: "약간 있음", score: 1 }, { label: "중간", score: 2 }, { label: "심함", score: 3 }, { label: "매우 심함", score: 4 }],
    2: [{ label: "전혀 없음", score: 0 }, { label: "약간 있음", score: 1 }, { label: "중간", score: 2 }, { label: "심함", score: 3 }, { label: "매우 심함", score: 4 }],
    3: [{ label: "전혀 없음", score: 0 }, { label: "약간 있음", score: 1 }, { label: "중간", score: 2 }, { label: "심함", score: 3 }, { label: "매우 심함", score: 4 }],
    4: [{ label: "매우 만족함", score: 0 }, { label: "만족함", score: 1 }, { label: "중간", score: 2 }, { label: "불만족", score: 3 }, { label: "매우 불만족", score: 4 }],
    5: [{ label: "전혀 현저하지 않음", score: 0 }, { label: "조금 현저함", score: 1 }, { label: "다소 현저함", score: 2 }, { label: "많이 현저함", score: 3 }, { label: "매우 많이 현저함", score: 4 }],
    6: [{ label: "전혀 걱정하지 않음", score: 0 }, { label: "조금 걱정함", score: 1 }, { label: "다소 걱정함", score: 2 }, { label: "많이 걱정함", score: 3 }, { label: "매우 많이 걱정함", score: 4 }],
    7: [{ label: "전혀 방해되지 않음", score: 0 }, { label: "조금 방해됨", score: 1 }, { label: "다소 방해됨", score: 2 }, { label: "많이 방해됨", score: 3 }, { label: "매우 많이 방해됨", score: 4 }],
  },
  ALCOHOL: {
    1: [{ label: "전혀 마시지 않는다", score: 0 }, { label: "한달에 한번 미만", score: 1 }, { label: "한달에 2~4회", score: 2 }, { label: "1주일에 2~3회", score: 3 }, { label: "1주일에 4회 이상", score: 4 }],
    2: [{ label: "1~2잔", score: 0 }, { label: "3~4잔", score: 1 }, { label: "5~6잔", score: 2 }, { label: "7~9잔", score: 3 }, { label: "10잔 이상", score: 4 }],
    3: [{ label: "전혀 없다.", score: 0 }, { label: "한달에 1번 미만", score: 1 }, { label: "한달에 한번", score: 2 }, { label: "일주일에 한번", score: 3 }, { label: "매일 같이", score: 4 }],
    4: [{ label: "전혀 없다.", score: 0 }, { label: "한달에 1번 미만", score: 1 }, { label: "한달에 한번", score: 2 }, { label: "일주일에 한번", score: 3 }, { label: "매일 같이", score: 4 }],
    5: [{ label: "전혀 없다.", score: 0 }, { label: "한달에 1번 미만", score: 1 }, { label: "한달에 한번", score: 2 }, { label: "일주일에 한번", score: 3 }, { label: "매일 같이", score: 4 }],
    6: [{ label: "전혀 없다.", score: 0 }, { label: "한달에 1번 미만", score: 1 }, { label: "한달에 한번", score: 2 }, { label: "일주일에 한번", score: 3 }, { label: "매일 같이", score: 4 }],
    7: [{ label: "전혀 없다.", score: 0 }, { label: "한달에 1번 미만", score: 1 }, { label: "한달에 한번", score: 2 }, { label: "일주일에 한번", score: 3 }, { label: "매일 같이", score: 4 }],
    8: [{ label: "전혀 없다.", score: 0 }, { label: "한달에 1번 미만", score: 1 }, { label: "한달에 한번", score: 2 }, { label: "일주일에 한번", score: 3 }, { label: "매일 같이", score: 4 }],
    9: [{ label: "없었다.", score: 0 }, { label: "있지만, 지난 1년간에는 없었다.", score: 2 }, { label: "지난 1년간 있었다.", score: 4 }],
    10:[{ label: "없었다.", score: 0 }, { label: "있지만, 지난 1년간에는 없었다.", score: 2 }, { label: "지난 1년간 있었다.", score: 4 }],
  },
  DEVICE_ADDICTION: {
    1: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    2: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    3: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    4: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    5: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    6: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    7: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    8: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    9: [{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
    10:[{ label: "전혀 그렇지 않다", score: 1 }, { label: "그렇지 않다", score: 2 }, { label: "그렇다", score: 3 }, { label: "매우 그렇다", score: 4 }],
  },
};

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
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
        } else {
          Alert.alert("인증 오류", "로그인이 필요합니다.");
          router.replace("/login");
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
    axios
      .get(`/api/diagnosis/questions/${selectedType}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setQuestions(res.data);
        setAnswers({});
      })
      .catch(() => {
        Alert.alert("오류", "문항을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [selectedType, token]);

  const handleAnswer = (questionIndex, answerIndex) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      Alert.alert("알림", "모든 문항에 답변해 주세요.");
      return;
    }

    //점수 매핑
    const answerScores = questions.map((q, idx) => {
      const choices = choicesMap[selectedType]?.[q.number];
      const selectedIndex = answers[idx];
      return choices && selectedIndex !== undefined ? choices[selectedIndex].score : 0;
    });

    try {
      const response = await axios.post(
        "/api/diagnosis",
        {
          type: selectedType,
          answers: answerScores,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert(
        "제출 완료",
        `자가진단이 제출되었습니다.\n점수: ${response.data.diagnosisScore}`,
        [{ text: "확인", onPress: () => setSelectedType(null) }]
      );
    } catch {
      Alert.alert("오류", "제출에 실패했습니다.");
    }
  };

  if (!selectedType) {
    return (
      <View style={styles.container}>
        {selfCheckItems.map((itemKey) => (
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
            {questions.map((q, idx) => {
              const choices = choicesMap[selectedType]?.[q.number] || [];
              return (
                <View key={q.id} style={styles.questionBox}>
                  <Text style={styles.questionText}>
                    {q.number}. {q.questionText}
                  </Text>
                  <View style={styles.answerRow}>
                    {choices.map(({ label }, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.answerButton}
                        onPress={() => handleAnswer(idx, i)}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            answers[idx] === i && styles.radioOuterSelected,
                          ]}
                        >
                          {answers[idx] === i && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.answerLabel}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
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
    paddingTop: 20 
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
    fontWeight: "500" 
  },

  backButton: { 
    marginBottom: 16 
  },

  backButtonText: { 
    fontSize: 16, 
    color: "#000" 
  },

  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 30, 
    color: "#000" 
  },
  
  questionsContainer: { 
    paddingBottom: 10 
  },
  
  questionBox: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  
  questionText: { 
    fontSize: 15, 
    color: "#000", 
    marginBottom: 12 
  },
  
  answerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 8 
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
    flexShrink: 1 
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
    borderColor: "#000" 
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
    marginBottom: 90,
  },
  
  submitButtonText: { 
    fontWeight: "700", 
    fontSize: 18, 
    color: "#000" 
  }

});
