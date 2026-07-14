import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../validation/authSchema";
import authApi from "../api/authApi";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardBody } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ password }) => {
    try {
      await authApi.resetPassword({ token, password });
      showSuccess("Success", "Password updated successfully! Redirecting to login…");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      showError(
        "Update Failed",
        err?.response?.data?.message || "This reset link is invalid or has expired."
      );
    }
  };

  if (!token) {
    return (
      <Card>
        <CardBody className="text-center">
          <div className="text-danger text-sm font-semibold mb-4">
            This password reset link is missing its token.
          </div>
          <Link to="/forgot-password" className="mt-4 block text-center text-sm font-medium text-accent hover:underline">
            Request a new link
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Set a new password</h2>
          <p className="mt-1 text-sm text-gray-500">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Reset password
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
