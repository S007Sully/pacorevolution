import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold tracking-tight">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in the dark</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This door doesn't open. Try another way in.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-crimson"
        >
          Return
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went dark</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Reload
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
      { title: "PACO REVOLUTION — Private Social Club" },
      { name: "description", content: "Luxury nightlife, events, and curated community. By invitation." },
      { property: "og:title", content: "PACO REVOLUTION — Private Social Club" },
      { property: "og:description", content: "Luxury nightlife, events, and curated community. By invitation." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "PACO REVOLUTION — Private Social Club" },
      { name: "twitter:description", content: "Luxury nightlife, events, and curated community. By invitation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fe8b2c53-592f-4c31-b4ce-9e37e4b417ac/id-preview-c62af8ac--cbb8cc8f-597b-4502-a8b8-a72284578311.lovable.app-1779291336925.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fe8b2c53-592f-4c31-b4ce-9e37e4b417ac/id-preview-c62af8ac--cbb8cc8f-597b-4502-a8b8-a72284578311.lovable.app-1779291336925.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster theme="dark" position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
