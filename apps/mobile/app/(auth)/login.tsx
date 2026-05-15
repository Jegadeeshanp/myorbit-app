import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { Eye, EyeOff } from 'lucide-react-native';
import Svg, { Rect, Circle, Text as SvgText, Path, G } from 'react-native-svg';
import { API_BASE_URL } from '@myorbit/config';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

function GoogleIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={20} height={20}>
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </Svg>
  );
}

export default function LoginScreen() {
  const { login, signInWithGoogle, signInWithApple } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError]       = useState('');
  const passwordRef             = useRef<TextInput>(null);

  // Google OAuth request
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const accessToken = googleResponse.authentication?.accessToken;
      if (accessToken) {
        setOauthLoading('google');
        signInWithGoogle(accessToken)
          .then(() => router.replace('/(tabs)/'))
          .catch((e: Error) => {
            setError(e.message || 'Google sign-in failed. Please try again.');
            setOauthLoading(null);
          });
      }
    } else if (googleResponse?.type === 'error') {
      setError('Google sign-in was cancelled or failed.');
      setOauthLoading(null);
    }
  }, [googleResponse]);

  const handleGoogleSignIn = async () => {
    setError('');
    setOauthLoading('google');
    try {
      await promptGoogleAsync();
      // response handled in useEffect above
    } catch {
      setError('Could not open Google sign-in. Please try again.');
      setOauthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setOauthLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token from Apple');
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean).join(' ') || undefined;
      await signInWithApple(credential.identityToken, fullName);
      router.replace('/(tabs)/');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        setError(err?.message || 'Apple sign-in failed. Please try again.');
      }
      setOauthLoading(null);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(
        err?.message === 'Invalid credentials'
          ? 'Wrong email or password'
          : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    const baseUrl = API_BASE_URL || 'http://localhost:3000';
    Linking.openURL(`${baseUrl}/forgot-password`);
  };

  const isDisabled = loading || !!oauthLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0d1117' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card */}
        <View style={{
          backgroundColor: '#1c2128',
          borderRadius: 24,
          padding: 28,
          borderWidth: 1,
          borderColor: '#30363d',
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
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#e6edf3', marginTop: 16 }}>
              Sign in to MyOrbit
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
              Access your dashboard and track your life.
            </Text>
          </View>

          {/* Error */}
          {!!error && (
            <View style={{ backgroundColor: '#2D1515', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#7F1D1D' }}>
              <Text style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</Text>
            </View>
          )}

          {/* Google button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={isDisabled}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d',
              borderRadius: 12, paddingVertical: 14, marginBottom: 12,
              opacity: isDisabled ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            {oauthLoading === 'google'
              ? <ActivityIndicator size="small" color="#e6edf3" />
              : <GoogleIcon />}
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#e6edf3' }}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Apple button — iOS only */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={12}
              style={{ height: 50, marginBottom: 12 }}
              onPress={handleAppleSignIn}
            />
          )}

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#30363d' }} />
            <Text style={{ fontSize: 12, color: '#6B7280', marginHorizontal: 12 }}>or sign in with email</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#30363d' }} />
          </View>

          {/* Email */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#adbac7', marginBottom: 8 }}>Email</Text>
          <TextInput
            style={{
              backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
              fontSize: 15, color: '#e6edf3', marginBottom: 16,
            }}
            placeholder="you@gmail.com"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            importantForAutofill="yes"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            editable={!isDisabled}
          />

          {/* Password */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#adbac7' }}>Password</Text>
            <TouchableOpacity onPress={openForgotPassword}>
              <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '500' }}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={{
            backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d',
            borderRadius: 12, flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, marginBottom: 28,
          }}>
            <TextInput
              ref={passwordRef}
              style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: '#e6edf3' }}
              placeholder="••••••••"
              placeholderTextColor="#4B5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isDisabled}
            />
            <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={{ padding: 4 }}>
              {showPw ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isDisabled}
            style={{
              backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16,
              alignItems: 'center', opacity: isDisabled ? 0.7 : 1,
            }}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={{ fontSize: 16, fontWeight: '700', color: '#e6edf3' }}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{ alignItems: 'center', marginTop: 24, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
            Don't have an account?{' '}
            <Text style={{ color: '#10B981', fontWeight: '600' }}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
