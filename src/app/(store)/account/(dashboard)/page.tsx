"use client";

import { useAuth } from "@/lib/store/auth";
import { useCustomerOrders } from "@/lib/firebase/orders";
import { AccountOverview } from "@/components/account/account-overview";

export default function AccountOverviewPage() {
  const uid = useAuth((s) => s.user?.uid);
  const { data: orders = [] } = useCustomerOrders(uid);
  return (
    <AccountOverview recentOrder={orders[0] ?? null} orderCount={orders.length} />
  );
}
