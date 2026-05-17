import React, { useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Sparkles, X, ArrowUp } from 'lucide-react-native';
import { sendAICommand } from '@myorbit/api';
import { useTheme } from '@/lib/themeStore';

const EXAMPLES = [
  'Add task call dentist tomorrow',
  'Add ₹200 food expense',
  'Log meditation done',
  'Mark task done: buy groceries',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string, action?: string) => void;
}

export default function AICommandModal({ visible, onClose, onSuccess }: Props) {
  const t = useTheme();
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const reset = useCallback(() => {
    setInput('');
    setResult(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const submit = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await sendAICommand(cmd);
      setResult({ ok: data.success, msg: data.message });
      if (data.success) {
        onSuccess?.(data.message, data.action);
        setTimeout(() => {
          reset();
          onClose();
        }, 1200);
      }
    } catch {
      setResult({ ok: false, msg: 'Command failed — check your connection' });
    } finally {
      setLoading(false);
    }
  }, [input, loading, onClose, onSuccess, reset]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: t.modalBg, borderColor: t.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <View style={styles.headerLeft}>
              <Sparkles size={16} color="#10B981" />
              <Text style={[styles.headerTitle, { color: t.text }]}>AI Command</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={t.subText} />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={[styles.inputRow, { borderBottomColor: t.border }]}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Type a command…"
              placeholderTextColor={t.mutedText}
              style={[styles.input, { color: t.text }]}
              autoFocus
              editable={!loading}
              onSubmitEditing={() => void submit()}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={() => void submit()}
              disabled={!input.trim() || loading}
              style={[
                styles.sendBtn,
                (!input.trim() || loading) && styles.sendBtnDisabled,
              ]}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <ArrowUp size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>

          {/* Result */}
          {result && (
            <View style={[
              styles.result,
              { backgroundColor: result.ok ? '#D1FAE5' : '#FEE2E2' },
            ]}>
              <Text style={[styles.resultText, { color: result.ok ? '#065F46' : '#991B1B' }]}>
                {result.msg}
              </Text>
            </View>
          )}

          {/* Quick examples */}
          {!result && (
            <View style={styles.examples}>
              <Text style={[styles.examplesLabel, { color: t.mutedText }]}>Try:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examplesScroll}>
                {EXAMPLES.map(ex => (
                  <TouchableOpacity
                    key={ex}
                    onPress={() => { setInput(ex); inputRef.current?.focus(); }}
                    style={[styles.chip, { backgroundColor: t.surface, borderColor: t.border }]}
                  >
                    <Text style={[styles.chipText, { color: t.subText }]}>{ex}</Text>
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

const styles = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'flex-end' },
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:         { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 32 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:   { fontSize: 14, fontWeight: '600' },
  inputRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  input:         { flex: 1, fontSize: 15, paddingVertical: 4 },
  sendBtn:       { width: 36, height: 36, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  result:        { marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  resultText:    { fontSize: 13, fontWeight: '500' },
  examples:      { paddingTop: 12, paddingHorizontal: 16 },
  examplesLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  examplesScroll:{ gap: 8, paddingBottom: 4 },
  chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText:      { fontSize: 12 },
});
