import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Likes() {
  return (
    <View style={styles.container}>
      <Text>마인드케어</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor : "#ffff",
    justifyContent: "center",
    alignItems: "center",
  },
});
