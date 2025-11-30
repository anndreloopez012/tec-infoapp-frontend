import { Outlet } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PageTransition } from '@/components/PageTransition';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
};
