import { AuthUI } from '@/components/ui/auth-fuse';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return <AuthUI />;
}
