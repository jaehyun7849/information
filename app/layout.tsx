import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { icons:{icon:"/favicon.svg"}, title: "오늘의 진짜 정보판 | 서울 기온", description: "공개 원천의 현재 시각 예보 기온을 기록하고, 데이터가 오지 않을 때도 마지막 정상값을 보존합니다." };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>}
