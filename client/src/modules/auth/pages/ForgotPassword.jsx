import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { forgotPasswordSchema } from "../validation/authSchema";
import authApi from "../api/authApi";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardBody } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPassword() {
  const { showSuccess, showError } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values) => {
    try {
      await authApi.forgotPassword(values);
      setSubmitted(true);
      showSuccess("Success", "Password reset link sent! Check your inbox.");
    } catch (err) {
      showError("Request Failed", err?.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <Card>
      <CardBody className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reset your password</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="text-sm text-gray-600 text-center font-medium py-2">
            A password reset link has been dispatched to your email address.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </CardBody>
    </Card>
  );
}
