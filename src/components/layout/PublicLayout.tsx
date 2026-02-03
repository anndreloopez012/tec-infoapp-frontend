import { Outlet } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PageTransition } from '@/components/PageTransition';
import { useGlobal } from '@/context/GlobalContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export const PublicLayout = () => {
  const { isLoading, config } = useGlobal();

  // Avoid showing hardcoded branding before the global config arrives
  if (isLoading && !config) {
    return <LoadingSpinner fullScreen text="Cargando portal..." />;
  }

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
