'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Brandbar } from '@/components/layout/Brandbar';
import { SyncProvider } from '@/components/SyncProvider';
import { useStore } from '@/lib/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const projects = useStore((s) => s.projects);
  const currentId = useStore((s) => s.currentProjectId);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => { if (hydrated && !user) router.replace('/login'); }, [hydrated, user, router]);
  useEffect(() => { if (!currentId && projects[0]) setCurrentProject(projects[0].id); }, [currentId, projects, setCurrentProject]);

  if (!hydrated || !user) {
    return <div className="h-screen flex items-center justify-center"><div className="loader" /></div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <SyncProvider />
      <Topbar onToggleSidebar={() => setOpen((v) => !v)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar open={open} />
        <main className="flex-1 min-w-0 overflow-y-auto custom-scroll">
          <div className="p-4 md:p-6 animate-fadeIn">{children}</div>
        </main>
      </div>
      <Brandbar />
    </div>
  );
}
