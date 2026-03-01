"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@chat/shared";

import { apiClient, ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path.join(".")] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: formData.email });
      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            Check your email for a reset link
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-center text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{formData.email}</span>, we sent a
            password reset link. Please check your inbox and spam folder.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
