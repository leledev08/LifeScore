import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { login } from '../api/auth';
import AuthCard from '../components/AuthCard';

export default function Login() {
  const { setAuth, token } = useAuthStore();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login({ email, password }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/', { replace: true });
    },
  });

  if (token) return <Navigate to="/" replace />;

  const errorMessage = error
    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Login failed'
    : null;

  return (
    <AuthCard
      title="Sign in to LifeScore"
      submitLabel="Sign in"
      onSubmit={(email, password) => mutate({ email, password })}
      isPending={isPending}
      error={errorMessage}
      footer={{ text: "Don't have an account?", linkTo: '/register', linkLabel: 'Sign up' }}
    />
  );
}
