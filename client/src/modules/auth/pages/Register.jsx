import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../validation/authSchema";
import authApi from "../api/authApi";
import { useToast } from "@/contexts/ToastContext";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export default function Register() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      roleName: "Workshop-Staff",
    },
  });

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...payload }) => {
    try {
      await authApi.register(payload);
      showSuccess("Success", "Account created! Redirecting to login…");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      showError(
        "Registration Failed",
        err?.response?.data?.message || "Unable to create account. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-[-0.03em]">Create your account</h2>
        <p className="mt-1.5 text-[14px] text-gray-400 font-medium">
          Get started with SR TAKAT inventory management
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Full Name *"
            autoComplete="name"
            placeholder="e.g. Jane Doe"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Email Address *"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password *"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirm Password *"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>
          <Select
            label="Account Role"
            error={errors.roleName?.message}
            options={[
              { value: "Workshop-Staff", label: "Workshop Staff (Default)" },
              { value: "Manager", label: "Manager" },
              { value: "Admin", label: "Admin" },
            ]}
            {...register("roleName")}
          />

          <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full mt-1">
            Create Account
          </Button>
        </form>
      </div>

      {/* Login Link */}
      <p className="text-center text-[14px] text-gray-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
