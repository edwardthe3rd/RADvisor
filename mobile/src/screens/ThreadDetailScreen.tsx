import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";

export default function ThreadDetailScreen() {
  const route = useRoute<any>();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { id } = route.params;
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["thread-messages", id],
    queryFn: async () => {
      const res = await api.get(`/messaging/threads/${id}/messages/`);
      return res.data.results ?? res.data;
    },
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/messaging/threads/${id}/messages/`, { body: text });
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["thread-messages", id] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.body}</Text>
        <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.text.tertiary}
          multiline
        />
        <TouchableOpacity
          onPress={() => text.trim() && sendMutation.mutate()}
          disabled={!text.trim() || sendMutation.isPending}
        >
          <Ionicons
            name="send"
            size={24}
            color={text.trim() ? colors.brand.primary : colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.backgroundAlt },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
  },
  bubbleMe: {
    backgroundColor: colors.brand.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.surface.card,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 15, color: colors.text.primary, lineHeight: 20 },
  msgTextMe: { color: colors.text.inverse },
  msgTime: { fontSize: 10, color: colors.text.tertiary, marginTop: 4, alignSelf: "flex-end" },
  msgTimeMe: { color: "rgba(255,255,255,0.7)" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: colors.surface.borderLight,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
});
