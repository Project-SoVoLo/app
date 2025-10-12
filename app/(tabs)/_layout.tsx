import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";

type IconName = "home" | "chatbubble-ellipses" | "document-text" | "medkit" | "people";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
        position: "absolute",
        left: 10,
        right: 10,
        borderRadius: 25,
        backgroundColor: "#fff",
        height: 80,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 15, //안드로이드용 그림자
        borderTopWidth: 0,
        // tabBarHideOnKeyboard: true,
      },
      tabBarItemStyle: {
        paddingVertical:10,
    },
        tabBarIcon: ({ color, size }) => {
          let iconName: IconName;

          if (route.name === "index") iconName = "home";
          else if (route.name === "chatbot") iconName = "chatbubble-ellipses";
          else if (route.name === "diagnosis") iconName = "document-text";
          else if (route.name === "mindcare") iconName = "medkit";
          else iconName = "people";

          return <Ionicons name={iconName} size={size+4} color={color}  />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="chatbot" options={{ title: "Chatbot" }} />
      <Tabs.Screen name="diagnosis" options={{ title: "Diagnosis" }} />
      <Tabs.Screen name="mindcare" options={{ title: "Mindcare" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
    </Tabs>
  );
}
