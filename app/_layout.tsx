import { useColorScheme } from '@/hooks/use-color-scheme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, StatusBar as RNStatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';


function AppHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
    //시작 시 로그인확인
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    //결과에 따라 로그인 상태 업데이트
    checkLoginStatus();
    //이벤트 발생시 로그인 상태 업데이트
    const subscription = DeviceEventEmitter.addListener('loginStateChange', checkLoginStatus);
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#ffff" }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoBox} onPress={() => router.push('/')}>
          <Image
              source={require('../assets/images/sovoro_logo.png')}
              style={{ width: 60, height: 60}}
              resizeMode="contain"
            />
        </TouchableOpacity>
        
        {isLoggedIn ? (
          <TouchableOpacity
            style={styles.profileBox}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle-outline" size={40} color="#273042" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.profileBox}
            onPress={() => router.push('/login')}
          >
            <FontAwesome5 name="sign-in-alt" size={35} color="#273042" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppHeader /> 
      
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="login"/> 
          <Stack.Screen name="profile"/> 
          {/* <Stack.Screen name="noticelist" />
          <Stack.Screen name="noticedetail" /> */}
        </Stack>
        <RNStatusBar/>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#fff",
  },

  logoBox: {
    justifyContent: "center",
    alignItems: "center",
  },

  profileBox: {
    width: 45,
    justifyContent: "center",
    alignItems: "center",
  }

});
