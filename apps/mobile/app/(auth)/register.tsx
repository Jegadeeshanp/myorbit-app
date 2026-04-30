import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { registerUser, setAuthToken } from '@myorbit/api';
import { useAuthStore } from '@/lib/authStore';
import * as SecureStore from 'expo-secure-store';
import { Eye, EyeOff } from 'lucide-react-native';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';

export default function RegisterScreen() {
  const { hydrate } = useAuthStore();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { token, user } = await registerUser(name.trim(), email.trim().toLowerCase(), password);
      await SecureStore.setItemAsync('myorbit_token', token);
      await SecureStore.setItemAsync('myorbit_user', JSON.stringify(user));
      setAuthToken(token);
      await hydrate();
      router.replace('/(tabs)/');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: 'white' as const,
    marginBottom: 16,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0D0D0D' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          backgroundColor: '#1A1A1A',
          borderRadius: 24,
          padding: 28,
          borderWidth: 1,
          borderColor: '#2A2A2A',
        }}>
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
              <Svg width={60} height={60} viewBox="0 0 40 40">
                <Rect x="0" y="0" width="40" height="40" rx="10" ry="10" fill="#16A34A" />
                <Circle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
                <Circle cx="20" cy="7" r="2.5" fill="white" />
                <Circle cx="33" cy="20" r="2.5" fill="white" />
                <Circle cx="20" cy="33" r="2.5" fill="white" />
                <Circle cx="7" cy="20" r="2.5" fill="white" />
                <SvgText x="20" y="26" textAnchor="middle" fontFamily="System" fontWeight="800" fontSize="16" fill="white">M</SvgText>
              </Svg>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: 'white', marginTop: 16 }}>
              Create your account
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>
              Join MyOrbit today
            </Text>
          </View>

          {error ? (
            <View style={{ backgroundColor: '#2D1515', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#7F1D1D' }}>
              <Text style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 13, fontWeight: '600', color: '#D1D5DB', marginBottom: 8 }}>Name</Text>
          <TextInput
            style={inputStyle}
            placeholder="Your full name"
            placeholderTextColor="#4B5563"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <Text style={{ fontSize: 13, fontWeight: '600', color: '#D1D5DB', marginBottom: 8 }}>Email</Text>
          <TextInput
            ref={emailRef}
            style={inputStyle}
            placeholder="you@example.com"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            importantForAutofill="yes"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={{ fontSize: 13, fontWeight: '600', color: '#D1D5DB', marginBottom: 8 }}>Password</Text>
          <View style={{
            backgroundColor: '#242424', borderWidth: 1, borderColor: '#333333',
            borderRadius: 12, flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, marginBottom: 28,
          }}>
            <TextInput
              ref={passwordRef}
              style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: 'white' }}
              placeholder="Min. 8 characters"
              placeholderTextColor="#4B5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={{ padding: 4 }}>
              {showPw ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={{ backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ alignItems: 'center', marginTop: 24, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
            Already have an account?{' '}
            <Text style={{ color: '#10B981', fontWeight: '600' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
