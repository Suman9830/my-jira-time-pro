import MeProvider from "@/components/MeContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <MeProvider>{children}</MeProvider>;
}
