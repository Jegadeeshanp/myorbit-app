import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Animated, Image, Alert,
} from 'react-native';
import { Sparkles, X, ArrowUp, TrendingUp, CheckCircle, AlertCircle, Paperclip, Camera, TrendingDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { sendAICommand, sendImageScan } from '@myorbit/api';
import type { AIMessage, DailySummary, ImageScanResult, VisionUpdatedAsset, VisionUnmatched, VisionParsed } from '@myorbit/api';
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

// ── Image vision result card ──────────────────────────────────────────────────

const IMAGE_TYPE_LABELS: Record<string, string> = {
  bank_statement:       '🏦 Bank Statement',
  investment_portfolio: '📈 Investment Portfolio',
  property_valuation:   '🏠 Property Valuation',
  net_worth:            '💼 Net Worth',
  expense_receipt:      '🧾 Receipt',
  unknown:              '📄 Document',
};

function ImageVisionCard({ data, t }: { data: NonNullable<ImageScanResult['data']>; t: ReturnType<typeof useTheme> }) {
  const sym = data.parsed?.currency === 'INR' ? '₹' : '$';
  const updated   = data.updated   ?? [];
  const unmatched = data.unmatched ?? [];
  const imageType = data.parsed?.imageType ?? 'unknown';

  return (
    <View style={[visionStyles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      {/* Header */}
      <View style={[visionStyles.header, { backgroundColor: '#D1FAE5', borderBottomColor: '#A7F3D0' }]}>
        <Text style={visionStyles.headerText}>{IMAGE_TYPE_LABELS[imageType] ?? '📄 Document'}</Text>
        {data.parsed?.institution ? (
          <Text style={[visionStyles.institutionText, { color: '#059669' }]}> · {data.parsed.institution}</Text>
        ) : null}
        {data.parsed?.date ? (
          <Text style={[visionStyles.dateText, { color: '#6B7280' }]}>{data.parsed.date}</Text>
        ) : null}
      </View>

      {/* Updated assets */}
      {updated.length > 0 && (
        <View style={visionStyles.section}>
          <Text style={[visionStyles.sectionLabel, { color: '#059669' }]}>
            ✓ Updated {updated.length} asset{updated.length > 1 ? 's' : ''}
          </Text>
          {updated.map((u: VisionUpdatedAsset) => {
            const diff = u.newValue - u.oldValue;
            return (
              <View key={u.id} style={visionStyles.assetRow}>
                <Text style={[visionStyles.assetName, { color: t.text }]} numberOfLines={1}>{u.name}</Text>
                <View style={visionStyles.assetValues}>
                  <Text style={[visionStyles.oldValue, { color: t.subText }]}>{sym}{u.oldValue.toLocaleString()}</Text>
                  <Text style={[visionStyles.arrow, { color: t.subText }]}> → </Text>
                  <Text style={[visionStyles.newValue, { color: t.text }]}>{sym}{u.newValue.toLocaleString()}</Text>
                  <Text style={[visionStyles.diff, { color: diff >= 0 ? '#10B981' : '#EF4444' }]}>
                    {' '}({diff >= 0 ? '+' : ''}{sym}{Math.abs(diff).toLocaleString()})
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Unmatched */}
      {unmatched.length > 0 && (
        <View style={[visionStyles.section, { backgroundColor: '#FFFBEB', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#FDE68A' }]}>
          <Text style={[visionStyles.sectionLabel, { color: '#D97706' }]}>
            ⚠ {unmatched.length} unmatched — add these assets first
          </Text>
          {unmatched.map((u: VisionUnmatched, i: number) => (
            <View key={i} style={visionStyles.unmatchedRow}>
              <Text style={[visionStyles.unmatchedName, { color: '#92400E' }]} numberOfLines={1}>{u.name}</Text>
              <Text style={[visionStyles.unmatchedValue, { color: '#92400E' }]}>{sym}{u.value.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}
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

interface ImageAttachment {
  base64:     string;
  mimeType:   string;
  localUri:   string;
}

type ChatMessage = {
  role:       'user' | 'assistant';
  content:    string;
  summary?:   DailySummary;
  visionData?: NonNullable<ImageScanResult['data']>;
  currency?:  string;
  thumbUri?:  string;
};

export default function AICommandModal({ visible, onClose, onSuccess }: Props) {
  const t = useTheme();
  const [input,           setInput]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [activeTab,       setActiveTab]       = useState(0);
  const [hintIdx,         setHintIdx]         = useState(0);
  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);
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

  const reset = useCallback(() => { setInput(''); setLoading(false); setImageAttachment(null); }, []);

  const handleClose = useCallback(() => {
    reset();
    setMessages([]);
    onClose();
  }, [reset, onClose]);

  // ── Image picker ───────────────────────────────────────────────────────────
  const pickImage = useCallback(async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to scan documents.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed to select images.');
          return;
        }
      }

      const result = await (source === 'camera'
        ? ImagePicker.launchCameraAsync({ base64: true, quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images })
        : ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images })
      );

      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0];
        const ext   = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mime  = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        setImageAttachment({ base64: asset.base64!, mimeType: mime, localUri: asset.uri });
      }
    } catch {
      Alert.alert('Error', 'Could not open image picker.');
    }
  }, []);

  const showImagePicker = useCallback(() => {
    Alert.alert(
      'Attach Document',
      'Scan a bank statement, portfolio screenshot, or any financial document',
      [
        { text: 'Take Photo', onPress: () => pickImage('camera') },
        { text: 'Choose from Library', onPress: () => pickImage('library') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [pickImage]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    const cmd = input.trim();
    if ((!cmd && !imageAttachment) || loading) return;

    const thumbUri = imageAttachment?.localUri;
    setMessages(prev => [...prev, {
      role: 'user',
      content: cmd || '📎 Attached a financial document for scanning',
      thumbUri,
    }]);
    setInput('');
    const img = imageAttachment;
    setImageAttachment(null);
    setLoading(true);

    try {
      // ── Vision path ────────────────────────────────────────────────────────
      if (img) {
        const data = await sendImageScan(img.base64, img.mimeType, cmd || undefined);
        const visionData = data.data;
        const currency   = visionData?.parsed?.currency;
        setMessages(prev => [...prev, {
          role: 'assistant', content: data.message, visionData, currency,
        }]);
        if (data.success) {
          onSuccess?.(data.message, 'UPDATE_ASSET');
        }
        return;
      }

      // ── Text path ──────────────────────────────────────────────────────────
      const history: AIMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
      const data = await sendAICommand(cmd, history);
      const summary = data.data?.summary as DailySummary | undefined;
      setMessages(prev => [...prev, { role: 'assistant' as const, content: data.message, summary }]);

      if (data.success) {
        onSuccess?.(data.message, data.action);
        if (data.action !== 'DAILY_SUMMARY' && data.action !== 'QUERY') {
          setTimeout(() => { reset(); setMessages([]); onClose(); }, 2500);
        }
      }
    } catch (err: any) {
      const serverMsg = err?.message;
      const content = serverMsg && serverMsg !== 'Command failed'
        ? serverMsg
        : 'Command failed — check your connection and try again.';
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
    }
  }, [input, imageAttachment, loading, messages, onClose, onSuccess, reset]);

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

        <View style={[styles.sheet, { backgroundColor: t.cardBg, borderColor: t.border }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: t.border, backgroundColor: t.cardBg }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.sparkleWrap, { backgroundColor: '#D1FAE5' }]}>
                <Sparkles size={13} color="#059669" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: t.text, fontSize: 14, fontWeight: '700' }]}>AI Command</Text>
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
                  {msg.thumbUri && (
                    <Image source={{ uri: msg.thumbUri }} style={styles.thumbPreview} resizeMode="cover" />
                  )}
                  {msg.summary && <SummaryCard summary={msg.summary} t={t} />}
                  {msg.visionData && <ImageVisionCard data={msg.visionData} t={t} />}
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

          {/* Image attachment preview */}
          {imageAttachment && (
            <View style={[styles.attachPreviewRow, { borderBottomColor: t.border }]}>
              <Image source={{ uri: imageAttachment.localUri }} style={styles.attachThumb} resizeMode="cover" />
              <Text style={[styles.attachLabel, { color: '#059669' }]} numberOfLines={2}>
                📎 Document attached — I'll scan and update your assets
              </Text>
              <TouchableOpacity onPress={() => setImageAttachment(null)} style={styles.attachRemove}>
                <X size={12} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input */}
          <View style={[styles.inputWrap, { borderBottomColor: t.border }]}>
            {/* Attach button */}
            <TouchableOpacity
              onPress={showImagePicker}
              disabled={loading}
              style={[styles.attachBtn, imageAttachment && { backgroundColor: '#D1FAE5' }]}
            >
              <Paperclip size={16} color={imageAttachment ? '#059669' : t.subText} />
            </TouchableOpacity>

            <View style={[styles.inputBox, { backgroundColor: t.inputBg ?? t.surface, borderColor: t.border }]}>
              {!input && !loading && (
                <Animated.Text style={[styles.placeholder, { color: t.subText, opacity: hintOpacity }]} numberOfLines={1}>
                  {imageAttachment ? 'Optional context…' : ALL_EXAMPLES[hintIdx]}
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
              disabled={(!input.trim() && !imageAttachment) || loading}
              style={[styles.sendBtn, ((!input.trim() && !imageAttachment) || loading) && styles.sendBtnDisabled]}
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
  overlay:           { flex: 1, justifyContent: 'flex-end' },
  backdrop:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:             { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 34, maxHeight: '92%' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sparkleWrap:       { width: 28, height: 28, borderRadius: 9, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  headerTitle:       { fontSize: 13, fontWeight: '700' },
  headerSub:         { fontSize: 10, marginTop: 1 },
  clearBtn:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginRight: 6 },
  clearBtnText:      { fontSize: 11 },
  closeBtn:          { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chatArea:          { maxHeight: 300, borderBottomWidth: StyleSheet.hairlineWidth },
  chatContent:       { padding: 12, gap: 8 },
  thumbPreview:      { width: 120, height: 80, borderRadius: 10, marginTop: 6, marginLeft: 26 },
  attachPreviewRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  attachThumb:       { width: 52, height: 40, borderRadius: 8 },
  attachLabel:       { flex: 1, fontSize: 11, fontWeight: '500' },
  attachRemove:      { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  attachBtn:         { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  inputWrap:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  inputBox:          { flex: 1, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, minHeight: 40, justifyContent: 'center' },
  placeholder:       { position: 'absolute', left: 12, right: 12, fontSize: 13 },
  input:             { fontSize: 13, paddingVertical: 0 },
  sendBtn:           { width: 38, height: 38, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:   { opacity: 0.35 },
  examplesWrap:      { paddingTop: 10 },
  tabsContent:       { gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  tab:               { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tabText:           { fontSize: 11 },
  chipsContent:      { gap: 7, paddingHorizontal: 12, paddingBottom: 4 },
  chip:              { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, maxWidth: 240 },
  chipText:          { fontSize: 11 },
});

const chatStyles = StyleSheet.create({
  bubble:        { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  userBubble:    { justifyContent: 'flex-end', flexDirection: 'row' },
  aiBubble:      { justifyContent: 'flex-start' },
  aiAvatar:      { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubbleContent: { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, minHeight: 34, justifyContent: 'center' },
  bubbleText:    { fontSize: 13, lineHeight: 19 },
});

const visionStyles = StyleSheet.create({
  card:           { borderRadius: 14, borderWidth: 1, marginTop: 6, marginLeft: 26, overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  headerText:     { fontSize: 12, fontWeight: '700', color: '#065F46' },
  institutionText:{ fontSize: 11, fontWeight: '500' },
  dateText:       { fontSize: 10, marginLeft: 'auto' as any },
  section:        { paddingHorizontal: 12, paddingVertical: 10 },
  sectionLabel:   { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as any, letterSpacing: 0.5, marginBottom: 8 },
  assetRow:       { marginBottom: 6 },
  assetName:      { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  assetValues:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' as any },
  oldValue:       { fontSize: 11, textDecorationLine: 'line-through' as any },
  arrow:          { fontSize: 11 },
  newValue:       { fontSize: 12, fontWeight: '700' },
  diff:           { fontSize: 11, fontWeight: '600' },
  unmatchedRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  unmatchedName:  { fontSize: 11, flex: 1, marginRight: 8 },
  unmatchedValue: { fontSize: 11, fontWeight: '600' },
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
