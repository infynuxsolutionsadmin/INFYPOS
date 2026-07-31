export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(221_83%_53%/0.08),transparent_50%)]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
