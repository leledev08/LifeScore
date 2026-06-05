import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { register } from '../api/auth';
import AuthCard from '../components/AuthCard';

export default function Register() {
  const { setAuth, token } = useAuthStore();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      register({ email, password }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/', { replace: true });
    },
  });

  if (token) return <Navigate to="/" replace />;

  const errorMessage = error
    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Registration failed'
    : null;

  return (
    <AuthCard
      title="Create your account"
      submitLabel="Create account"
      onSubmit={(email, password) => mutate({ email, password })}
      isPending={isPending}
      error={errorMessage}
      footer={{ text: 'Already have an account?', linkTo: '/login', linkLabel: 'Sign in' }}
    />
  );
}
