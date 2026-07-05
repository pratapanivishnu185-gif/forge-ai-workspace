import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Github } from "lucide-react";
import { Logo } from "@/components/branding";
import { Button, Field, Input } from "@/components/ui-kit";
import { authService } from "@/services";
import { useAuthStore } from "@/store/auth-store";
import { apiErrorMessage } from "@/lib/api-client";
import { BACKEND_URL } from "@/lib/api-constants";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type Form = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — ForgeMind AI" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: Form) {
    try {
      const tokens = await authService.login(values);
      login(tokens.accessToken, tokens.refreshToken, tokens.user);
      toast.success("Welcome back");
      navigate({ to: "/app/dashboard" });
    } catch (e) {
      const message = apiErrorMessage(e, "Login failed");
      toast.error(message);
      if (message.toLowerCase().includes("email is not verified")) {
        navigate({ to: "/verify-email", search: { email: getValues("email") } });
      }
    }
  }

  function oauthRedirect(provider: "google" | "github") {
    if (typeof window !== "undefined") {
      window.location.href = `${BACKEND_URL}/oauth2/authorization/${provider}`;
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-8">
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back to ForgeMind AI.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <Input type="password" autoComplete="current-password" {...register("password")} />
            </Field>
            <Button type="submit" loading={isSubmitting} className="w-full">Log in</Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => oauthRedirect("google")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm hover:bg-muted/40 transition"
            >
              <GoogleIcon className="h-4 w-4" />
              Google
            </button>
            <button
              type="button"
              onClick={() => oauthRedirect("github")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm hover:bg-muted/40 transition"
            >
              <Github className="h-4 w-4" />
              GitHub
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <Link to="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
            <Link to="/register" className="hover:text-foreground">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3c-2 1.4-4.5 2.3-7.3 2.3-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.3C41.7 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
