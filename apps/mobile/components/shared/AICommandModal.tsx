import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Animated,
} from 'react-native';
import { Sparkles, X, ArrowUp, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react-native';
import { sendAICommand } from '@myorbit/api';
import type { AIMessage, DailySummary } from '@myorbit/api';
import { useTheme } from '@/lib/themeStore';

// ── Example commands ──────────────────────────────────────────────────────────

const EXAMPLE_CATEGORIES = [
  {
    label: 'Tasks', color: '#10B981',
    examples: [
      'Add task gym every weekday 6am',
      'Gym done',
      'Snooze dentist to next week',
      'What tasks do I have today?',
      'Show overdue tasks',
    ],
  },
  {
    label: 'Money', color: '#3B82F6',
    examples: [
      '₹500 groceries on HDFC',
      'Transfer ₹2000 SBI to HDFC',
      'How much did I spend today?',
      '₹5000 rent monthly Axis',
    ],
  },
  {
    label: 'Habits', color: '#F59E0B',
    examples: [
      'Log meditation done',
      'Add habit drink water daily',
      'Which habits did I log today?',
      'Reading done',
    ],
  },
  {
    label: 'Summary', color: '#8B5CF6',
    examples: [
      'Summarize today',
      'How was my day?',
      'Show daily report',
      'Add goal run 5k by March',
    ],
  },
];

const ALL_EXAMPLES = EXAMPLE_CATEGORIES.flatMap(c => c.examples);

// ── Daily summary card ────────────────────────────────────────────────────────

function SummaryCard({ summary, t }: { summary: DailySummary; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={[summaryStyles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>

      {/* Tasks */}
      <View style={summaryStyles.section}>
        <View style={summaryStyles.sectionHeader}>
          <CheckCircle size={14} color="#10B981" />
          <Text style={[summaryStyles.sectionTitle, { color: t.text }]}>Tasks</Text>
        </View>
        <View style={summaryStyles.row}>
          <View style={[summaryStyles.badge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[summaryStyles.badgeNum, { color: '#065F46' }]}>{summary.tasks.completed}</Text>
            <Text style={[summaryStyles.badgeLabel, { color: '#065F46' }]}>done</Text>
          </View>
          <View style={[summaryStyles.badge, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[summaryStyles.badgeNum, { color: '#1D4ED8' }]}>{summary.tasks.pending}</Text>
            <Text style={[summaryStyles.badgeLabel, { color: '#1D4ED8' }]}>pending</Text>
          </View>
          {summary.tasks.overdue > 0 && (
            <View style={[summaryStyles.badge, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[summaryStyles.badgeNum, { color: '#DC2626' }]}>{summary.tasks.overdue}</Text>
              <Text style={[summaryStyles.badgeLabel, { color: '#DC2626' }]}>overdue</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[summaryStyles.divider, { backgroundColor: t.border }]} />

      {/* Spending */}
      <View style={summaryStyles.section}>
        <View style={summaryStyles.sectionHeader}>
          <TrendingUp size={14} color="#3B82F6" />
          <Text style={[summaryStyles.sectionTitle, { color: t.text }]}>Spent today</Text>
          <Text style={[summaryStyles.totalAmount, { color: t.text }]}>
            ₹{Math.round(summary.spending.total).toLocaleString('en-IN')}
          </Text>
        </View>
        {summary.spending.topCategories.slice(0, 3).map(c => (
          <View key={c.category} style={summaryStyles.catRow}>
            <Text style={[summaryStyles.catName, { color: t.subText }]}>{c.category}</Text>
            <Text style={[summaryStyles.catAmt, { color: t.text }]}>₹{Math.round(c.amount).toLocaleString('en-IN')}</Text>
          </View>
        ))}
        {summary.spending.total === 0 && (
          <Text style={[summaryStyles.emptyNote, { color: t.subText }]}>No expenses today 👍</Text>
        )}
      </View>

      <View style={[summaryStyles.divider, { backgroundColor: t.border }]} />

      {/* Habits */}
      <View style={summaryStyles.section}>
        <View style={summaryStyles.sectionHeader}>
          <AlertCircle size={14} color="#F59E0B" />
          <Text style={[summaryStyles.sectionTitle, { color: t.text }]}>Habits</Text>
          <Text style={[summaryStyles.habitScore, { color: '#F59E0B' }]}>
            {summary.habits.logged}/{summary.habits.total}
          </Text>
        </View>
        {summary.habits.done.length > 0 && (
          <Text style={[summaryStyles.habitList, { color: '#10B981' }]}>
            ✅ {summary.habits.done.join('  ·  ')}
          </Text>
        )}
        {summary.habits.missed.length > 0 && (
          <Text style={[summaryStyles.habitList, { color: t.subText }]}>
            ⭕ {summary.habits.missed.join('  ·  ')}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Chat message bubble ───────────────────────────────────────────────────────

function ChatBubble({ role, content, t }: { role: 'user' | 'assistant'; content: string; t: ReturnType<typeof useTheme> }) {
  const isUser = role === 'user';
  return (
    <View style={[chatStyles.bubble, isUser ? chatStyles.userBubble : chatStyles.aiBubble]}>
      {!isUser && (
        <View style={chatStyles.aiAvatar}>
          <Sparkles size={10} color="#10B981" />
        </View>
      )}
      <View style={[
        chatStyles.bubbleContent,
        isUser
          ? { backgroundColor: '#10B981' }
          : { backgroundColor: t.surface, borderColor: t.border, borderWidth: StyleSheet.hairlineWidth },
      ]}>
        <Text style={[chatStyles.bubbleText, { color: isUser ? '#fff' : t.text }]}>{content}</Text>
      </View>
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible:   boolean;
  onClose:   () => void;
  onSuccess?: (message: string, action?: string) => void;
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function AICommandModal({ visible, onClose, onSuccess }: Props) {
  const t = useTheme();
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState(0);
  const [hintIdx,    setHintIdx]    = useState(0);
  const [messages,   setMessages]   = useState<{ role: 'user' | 'assistant'; content: string; summary?: DailySummary }[]>([]);
  const inputRef  = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const hintOpacity = useRef(new Animated.Value(1)).current;

  // Cycle placeholder when idle
  useEffect(() => {
    if (!visible || input || loading) return;
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(hintOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(hintOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      setHintIdx(i => (i + 1) % ALL_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [visible, input, loading, hintOpacity]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const reset = useCallback(() => { setInput(''); setLoading(false); }, []);

  const handleClose = useCallback(() => {
    reset();
    setMessages([]);
    onClose();
  }, [reset, onClose]);

  const submit = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || loading) return;

    const userMsg = { role: 'user' as const, content: cmd };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build history for context (exclude summary data, just role+content)
    const history: AIMessage[] = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const data = await sendAICommand(cmd, history);
      const summary = data.data?.summary as DailySummary | undefined;
      const aiMsg = { role: 'assistant' as const, content: data.message, summary };
      setMessages(prev => [...prev, aiMsg]);

      if (data.success) {
        onSuccess?.(data.message, data.action);
        // Auto-close after 2.5 s if no summary (summaries stay open for reading)
        if (data.action !== 'DAILY_SUMMARY' && data.action !== 'QUERY') {
          setTimeout(() => { reset(); setMessages([]); onClose(); }, 2500);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant', content: 'Command failed — check your connection and try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, onClose, onSuccess, reset]);

  const fillInput = (text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const showHistory  = messages.length > 0;
  const currentCat   = EXAMPLE_CATEGORIES[activeTab];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: t.modalBg, borderColor: t.border }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleWrap}>
                <Sparkles size={13} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: t.text }]}>AI Command</Text>
                <Text style={[styles.headerSub, { color: t.subText }]}>
                  {showHistory ? 'Conversation active · typos ok!' : 'Just tell me what to do'}
                </Text>
              </View>
            </View>
            {showHistory && (
              <TouchableOpacity onPress={() => setMessages([])}
                style={[styles.clearBtn, { borderColor: t.border }]}>
                <Text style={[styles.clearBtnText, { color: t.subText }]}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.closeBtn, { backgroundColor: t.border }]}>
              <X size={14} color={t.subText} />
            </TouchableOpacity>
          </View>

          {/* Conversation history */}
          {showHistory && (
            <ScrollView ref={scrollRef} style={[styles.chatArea, { borderBottomColor: t.border }]}
              contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
              {messages.map((msg, idx) => (
                <View key={idx}>
                  <ChatBubble role={msg.role} content={msg.content} t={t} />
                  {msg.summary && <SummaryCard summary={msg.summary} t={t} />}
                </View>
              ))}
              {loading && (
                <View style={[chatStyles.bubble, chatStyles.aiBubble]}>
                  <View style={chatStyles.aiAvatar}><Sparkles size={10} color="#10B981" /></View>
                  <View style={[chatStyles.bubbleContent, { backgroundColor: t.surface, borderColor: t.border, borderWidth: StyleSheet.hairlineWidth }]}>
                    <ActivityIndicator size="small" color="#10B981" />
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Input */}
          <View style={[styles.inputWrap, { borderBottomColor: t.border }]}>
            <View style={[styles.inputBox, { backgroundColor: t.inputBg ?? t.surface, borderColor: t.border }]}>
              {!input && !loading && (
                <Animated.Text style={[styles.placeholder, { color: t.subText, opacity: hintOpacity }]} numberOfLines={1}>
                  {ALL_EXAMPLES[hintIdx]}
                </Animated.Text>
              )}
              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={v => { setInput(v); }}
                placeholder=""
                placeholderTextColor="transparent"
                style={[styles.input, { color: t.text }]}
                autoFocus={!showHistory}
                editable={!loading}
                onSubmitEditing={() => void submit()}
                returnKeyType="send"
                multiline={false}
              />
            </View>
            <TouchableOpacity
              onPress={() => void submit()}
              disabled={!input.trim() || loading}
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <ArrowUp size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>

          {/* Examples (hidden when conversation is active) */}
          {!showHistory && (
            <View style={styles.examplesWrap}>
              {/* Category tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                {EXAMPLE_CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity key={cat.label} onPress={() => setActiveTab(idx)}
                    style={[
                      styles.tab,
                      activeTab === idx
                        ? { backgroundColor: cat.color + '22', borderColor: cat.color }
                        : { backgroundColor: t.surface, borderColor: t.border },
                    ]}>
                    <Text style={[styles.tabText, { color: activeTab === idx ? cat.color : t.subText, fontWeight: activeTab === idx ? '600' : '400' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Example chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
                {currentCat.examples.map(ex => (
                  <TouchableOpacity key={ex} onPress={() => fillInput(ex)}
                    style={[styles.chip, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <Text style={[styles.chipText, { color: t.subText }]} numberOfLines={1}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay:          { flex: 1, justifyContent: 'flex-end' },
  backdrop:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:            { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 34, maxHeight: '92%' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sparkleWrap:      { width: 28, height: 28, borderRadius: 9, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 13, fontWeight: '700' },
  headerSub:        { fontSize: 10, marginTop: 1 },
  clearBtn:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginRight: 6 },
  clearBtnText:     { fontSize: 11 },
  closeBtn:         { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chatArea:         { maxHeight: 300, borderBottomWidth: StyleSheet.hairlineWidth },
  chatContent:      { padding: 12, gap: 8 },
  inputWrap:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  inputBox:         { flex: 1, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, minHeight: 40, justifyContent: 'center' },
  placeholder:      { position: 'absolute', left: 12, right: 12, fontSize: 13 },
  input:            { fontSize: 13, paddingVertical: 0 },
  sendBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:  { opacity: 0.35 },
  examplesWrap:     { paddingTop: 10 },
  tabsContent:      { gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  tab:              { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tabText:          { fontSize: 11 },
  chipsContent:     { gap: 7, paddingHorizontal: 12, paddingBottom: 4 },
  chip:             { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, maxWidth: 240 },
  chipText:         { fontSize: 11 },
});

const chatStyles = StyleSheet.create({
  bubble:        { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  userBubble:    { justifyContent: 'flex-end', flexDirection: 'row' },
  aiBubble:      { justifyContent: 'flex-start' },
  aiAvatar:      { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubbleContent: { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, minHeight: 34, justifyContent: 'center' },
  bubbleText:    { fontSize: 13, lineHeight: 19 },
});

const summaryStyles = StyleSheet.create({
  card:        { borderRadius: 14, borderWidth: 1, marginTop: 6, marginLeft: 26, overflow: 'hidden' },
  section:     { padding: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', flex: 1 },
  totalAmount:   { fontSize: 14, fontWeight: '700' },
  habitScore:    { fontSize: 14, fontWeight: '700' },
  row:         { flexDirection: 'row', gap: 8 },
  badge:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignItems: 'center' },
  badgeNum:    { fontSize: 16, fontWeight: '700' },
  badgeLabel:  { fontSize: 10, marginTop: 1 },
  divider:     { height: StyleSheet.hairlineWidth },
  catRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  catName:     { fontSize: 11 },
  catAmt:      { fontSize: 11, fontWeight: '600' },
  emptyNote:   { fontSize: 12 },
  habitList:   { fontSize: 11, lineHeight: 17, marginBottom: 2 },
});
