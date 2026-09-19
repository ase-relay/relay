import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function BerandaLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
