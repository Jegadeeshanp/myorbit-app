import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet, Target, HeartPulse, CheckCircle, ClipboardList,
  Lightbulb, Sparkles, Clock, Layers,
} from 'lucide-react-native';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';
import { useAuthStore } from '@/lib/authStore';

const E = '#059669';   // emerald-700 — primary green
const E2 = '#10B981';  // emerald-500

// ── Feature cards data ─────────────────────────────────────────────────────────
const FEATURES = [
  { title: 'Finance',  description: 'Link accounts, track spending, and follow your investments in one place.',  Icon: Wallet },
  { title: 'Goals',    description: 'Set targets and watch progress over time with gentle nudges.',               Icon: Target },
  { title: 'Health',   description: 'Track habits, fitness, and wellness metrics with a calm dashboard.',         Icon: HeartPulse },
  { title: 'Habits',   description: 'Build momentum with habit streaks and daily check-ins.',                     Icon: CheckCircle },
  { title: 'Tasks',    description: 'Capture tasks, projects, and reminders in a single view.',                   Icon: ClipboardList },
  { title: 'Insights', description: 'Smart prompts and summaries help you stay on track.',                        Icon: Lightbulb },
];

const BENEFITS = [
  { title: 'Private & secure',        description: 'Your data is yours. Everything stays private by default, and we never sell your information.',                                               emoji: '🔒' },
  { title: 'Everything in one place', description: 'From budgets to habits, you get a single home to track what matters without jumping between apps.',                                          emoji: '🧩' },
  { title: 'Smart insights',          description: 'Contextual summaries and gentle reminders help turn your intentions into progress.',                                                         emoji: '💡' },
];

// ── Net Worth Preview Card ─────────────────────────────────────────────────────
function NetWorthCard() {
  const investments = 14220;
  const expenses    = 2840;
  const savings     = 8500;
  const netWorth    = investments + savings; // 22720
  const fmt = (n: number) => '$' + n.toLocaleString('en-US');
  const bars = [0.72, 0.55, 0.65, 0.48];

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#059669', shadowOpacity: 0.12, shadowRadius: 20, elevation: 6 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' }}>Net Worth</Text>
          <Text style={{ fontSize: 24, fontWeight: '600', color: '#111827', marginTop: 2 }}>{fmt(netWorth)}</Text>
        </View>
        <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>+7.2%</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={{ flexDirection: 'row', backgroundColor: '#ECFDF5', borderRadius: 16, padding: 12, marginBottom: 16, height: 80, alignItems: 'flex-end', gap: 8 }}>
        {bars.map((h, i) => (
          <View key={i} style={{ flex: 1, height: `${h * 100}%`, borderRadius: 8, backgroundColor: i === 2 ? '#059669' : i === 0 ? '#34D399' : i === 1 ? '#6EE7B7' : '#A7F3D0' }} />
        ))}
      </View>

      {/* Breakdown */}
      <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, gap: 10 }}>
        {[
          { label: 'Investments', val: fmt(investments) },
          { label: 'Expenses',    val: fmt(expenses) },
          { label: 'Savings',     val: fmt(savings) },
        ].map((row) => (
          <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>{row.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{row.val}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: '600', color: '#111827', textAlign: 'center', letterSpacing: -0.3 }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 22, maxWidth: 300 }}>{subtitle}</Text>}
    </View>
  );
}

// ── Main landing ───────────────────────────────────────────────────────────────
export default function LandingScreen() {
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  // Already logged in → skip landing
  useEffect(() => {
    if (user) router.replace('/(tabs)/');
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F5' }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── NAV BAR ────────────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.85)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Svg width={40} height={40} viewBox="0 0 40 40">
              <Rect x="0" y="0" width="40" height="40" rx="10" ry="10" fill="#16A34A" />
              <Circle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
              <Circle cx="20" cy="7" r="2.5" fill="white" />
              <Circle cx="33" cy="20" r="2.5" fill="white" />
              <Circle cx="20" cy="33" r="2.5" fill="white" />
              <Circle cx="7" cy="20" r="2.5" fill="white" />
              <SvgText x="20" y="26" textAnchor="middle" fontFamily="System" fontWeight="800" fontSize="16" fill="white">M</SvgText>
            </Svg>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>MyOrbit</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: E }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 }}>
          <Text style={{ fontSize: 38, fontWeight: '600', color: '#111827', lineHeight: 46, letterSpacing: -0.5, marginBottom: 16 }}>
            Your life.{'\n'}One orbit.
          </Text>
          <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 26, marginBottom: 36 }}>
            Track your finances, goals, health, habits and tasks in one beautiful dashboard.
          </Text>

          {/* Get Started */}
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}
            style={{ backgroundColor: E, borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginBottom: 32, shadowColor: E, shadowOpacity: 0.35, shadowRadius: 12, elevation: 4 }}
            activeOpacity={0.88}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Get Started</Text>
          </TouchableOpacity>

          {/* Bullet points — 2-column grid like web */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { dot: true, text: 'Clean, modern UI' },
              { dot: true, text: 'Secure & private' },
              { dot: true, text: 'Works on any device' },
            ].map((f) => (
              <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: E2 }} />
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── FEATURES SECTION ───────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 40 }}>
          <SectionHeading
            title="Everything in one orbit"
            subtitle="Modules designed to keep your daily routines, finances, and goals aligned."
          />
          <View style={{ gap: 14 }}>
            {FEATURES.map(({ title, description, Icon }) => (
              <View key={title} style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={22} color={E} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 }}>{title}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>{description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── PRODUCT PREVIEW SECTION ────────────────────────────────────── */}
        <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 20, paddingVertical: 40 }}>
          <SectionHeading
            title="A dashboard you want to open every day"
            subtitle="A serene, focused view of your net worth, spending, and investments — with no noise."
          />
          <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, textAlign: 'center', marginBottom: 28, paddingHorizontal: 8 }}>
            MyOrbit's preview offers a clean overview so you can quickly see what matters. Designed to feel like a personal command center.
          </Text>
          <NetWorthCard />
        </View>

        {/* ── BENEFITS SECTION ───────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 40 }}>
          <SectionHeading
            title="Built for calm progress"
            subtitle="The tools you need, presented without clutter."
          />
          <View style={{ gap: 14 }}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 }}>{b.title}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>{b.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── ABOUT SECTION ──────────────────────────────────────────────── */}
        <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 20, paddingVertical: 40 }}>
          <SectionHeading
            title="A single orbit for your day"
            subtitle="Designed to feel like a calm companion, MyOrbit helps you stay on track without distraction."
          />
          <View style={{ gap: 14 }}>
            {/* Thoughtful by design */}
            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={20} color={E} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 }}>Thoughtful by design</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
                    From the typography to the pacing, everything is made so you can focus on the things that matter most. No frantic dashboards, just calm clarity.
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
                Built with privacy at the core, MyOrbit keeps your data yours and gives you control over what you share.
              </Text>
            </View>

            {/* Made for routines */}
            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={20} color={E} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 }}>Made for routines</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
                    Whether you're tracking finances, habits, or goals, MyOrbit is built to be part of your daily rhythm.
                  </Text>
                </View>
              </View>
            </View>

            {/* Flexible workflows */}
            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Layers size={20} color={E} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 }}>Flexible workflows</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
                    Start with a clean slate or import your existing routines — the canvas is yours to shape.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── CALL TO ACTION ─────────────────────────────────────────────── */}
        <View style={{ backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 56, alignItems: 'center' }}>
          {/* Glow blobs */}
          <View style={{ position: 'absolute', top: 20, left: '10%', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ position: 'absolute', bottom: 10, right: '5%', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />

          <Text style={{ fontSize: 28, fontWeight: '600', color: 'white', textAlign: 'center', letterSpacing: -0.3, marginBottom: 14 }}>
            Start organizing your life today.
          </Text>
          <Text style={{ fontSize: 14, color: '#A7F3D0', textAlign: 'center', lineHeight: 22, marginBottom: 36, maxWidth: 280 }}>
            Get started for free and see how a single dashboard can be the home for everything you care about.
          </Text>

          <View style={{ gap: 12, width: '100%' }}>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}
              style={{ backgroundColor: 'white', borderRadius: 50, paddingVertical: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}
              activeOpacity={0.88}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#059669' }}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ borderRadius: 50, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)' }}
              activeOpacity={0.88}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>Learn more</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <View style={{ backgroundColor: '#F7F7F5', paddingHorizontal: 20, paddingVertical: 32, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Svg width={36} height={36} viewBox="0 0 40 40">
              <Rect x="0" y="0" width="40" height="40" rx="10" ry="10" fill="#16A34A" />
              <Circle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
              <Circle cx="20" cy="7" r="2.5" fill="white" />
              <Circle cx="33" cy="20" r="2.5" fill="white" />
              <Circle cx="20" cy="33" r="2.5" fill="white" />
              <Circle cx="7" cy="20" r="2.5" fill="white" />
              <SvgText x="20" y="26" textAnchor="middle" fontFamily="System" fontWeight="800" fontSize="16" fill="white">M</SvgText>
            </Svg>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>MyOrbit</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 20 }}>
            The calm command center for your finances, habits, and goals.
          </Text>
          <View style={{ flexDirection: 'row', gap: 20, marginBottom: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <Text key={l} style={{ fontSize: 13, color: '#6B7280' }}>{l}</Text>
            ))}
          </View>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
            © {new Date().getFullYear()} MyOrbit. Built for calm progress.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
