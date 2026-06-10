import { Roboto } from "next/font/google";
import "./waitlist/waitlist.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export default function AppSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`waitlist-layout ${roboto.variable}`}>{children}</div>;
}
