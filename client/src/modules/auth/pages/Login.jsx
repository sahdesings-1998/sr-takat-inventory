import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../validation/authSchema";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (values) => {
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      showError(
        "Authentication Failed",
        err?.response?.data?.message || "Invalid email or password. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Welcome back</h2>
        <p className="mt-1 text-subtitle">
          Sign in to your SR TAKAT account to continue
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <div>
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="mt-2.5 flex justify-end">
              <Link
                to="/forgot-password"
                className="text-[13px] font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full mt-1">
            Sign in
          </Button>
        </form>
      </div>

      {/* Register Link */}
      <p className="text-center text-[14px] text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
