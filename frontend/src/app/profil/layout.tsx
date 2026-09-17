import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
