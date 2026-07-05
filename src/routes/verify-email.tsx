import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Logo } from "@/components/branding";
import { Button, Field, Input } from "@/components/ui-kit";
import { authService } from "@/services";
import { useAuthStore } from "@/store/auth-store";
import { apiErrorMessage } from "@/lib/api-client";

const searchSchema = z.object({
  email: z.string().optional(),
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
type Form = z.infer<typeof schema>;

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — ForgeMind AI" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email: emailParam } = Route.useSearch();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailParam ?? "", otp: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(values: Form) {
    try {
      const tokens = await authService.verifyEmailOtp(values);
      login(tokens.accessToken, tokens.refreshToken, tokens.user);
      toast.success("Email verified");
      navigate({ to: "/app/dashboard" });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Verification failed"));
    }
  }

  async function onResend() {
    const email = watch("email");
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setResending(true);
    try {
      await authService.resendVerificationOtp({ email });
      toast.success("If the email exists, a new code has been sent");
      setCooldown(30);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not resend code"));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-8">
          <h1 className="text-2xl font-semibold">Verify your email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit code we sent to your inbox.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field label="Verification code" error={errors.otp?.message}>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                className="tracking-[0.5em] text-center text-lg"
                {...register("otp")}
              />
            </Field>
            <Button type="submit" loading={isSubmitting} className="w-full">Verify email</Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={onResend}
              disabled={cooldown > 0 || resending}
              className="hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend code"}
            </button>
            <Link to="/login" className="hover:text-foreground">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
