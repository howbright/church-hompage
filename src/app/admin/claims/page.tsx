import type { Metadata } from "next";
import { ClaimsAdminPrototype } from "@/components/claims-prototype";

export const metadata: Metadata = { title: "청구 관리 | 관리자 메뉴" };

export default function AdminClaimsPage() {
  return <ClaimsAdminPrototype />;
}
