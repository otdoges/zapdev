// Skip static generation - auth issues during build
export const dynamic = "force-dynamic";

export default function FrameworksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
