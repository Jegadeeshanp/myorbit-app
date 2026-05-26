export default function TasksSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#060b14' }}>
      <div className="px-4 pb-24 pt-5 md:p-8 md:pb-8">
        {children}
      </div>
    </div>
  );
}
