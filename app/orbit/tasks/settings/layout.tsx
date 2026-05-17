export default function TasksSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="px-4 pb-24 pt-5 md:p-8 md:pb-8">
        {children}
      </div>
    </div>
  );
}
