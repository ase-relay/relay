import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function CariRuteLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
