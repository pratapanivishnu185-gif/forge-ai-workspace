import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/branding";
import { userService } from "@/services";
import { useAuthStore } from "@/store/auth-store";
import { apiErrorMessage } from "@/lib/api-client";

const searchSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenType: z.string().optional(),
  expiresIn: z.coerce.number().optional(),
  oauthError: z.string().optional(),
});

export const Route = createFileRoute("/oauth/callback")({
  head: () => ({ meta: [{ title: "Signing in — ForgeMind AI" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const { accessToken, refreshToken, oauthError } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    async function complete() {
      if (oauthError) {
        toast.error(oauthError);
        navigate({ to: "/login", replace: true });
        return;
      }
      if (!accessToken || !refreshToken) {
        toast.error("OAuth login failed");
        navigate({ to: "/login", replace: true });
        return;
      }
      try {
        useAuthStore.getState().setTokens(accessToken, refreshToken);
        const user = await userService.me();
        useAuthStore.getState().login(accessToken, refreshToken, user);
        toast.success("Logged in successfully");
        navigate({ to: "/app/dashboard", replace: true });
      } catch (e) {
        useAuthStore.getState().logout();
        toast.error(apiErrorMessage(e, "Could not complete OAuth login"));
        navigate({ to: "/login", replace: true });
      }
    }
    complete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background">
      <div className="text-center">
        <div className="flex justify-center mb-6"><Logo /></div>
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand" />
        <p className="mt-4 text-sm text-muted-foreground">Completing sign in…</p>
      </div>
    </div>
  );
}
