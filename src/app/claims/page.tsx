import type { Metadata } from "next";
import { ClaimsPrototype } from "@/components/claims-prototype";

export const metadata: Metadata = { title: "교인 청구 서비스 | 갈보리채플 강남교회" };

export default function ClaimsPage() {
  return <ClaimsPrototype />;
}
