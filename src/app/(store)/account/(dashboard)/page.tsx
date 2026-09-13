import { getOrders } from "@/lib/api";
import { AccountOverview } from "@/components/account/account-overview";

export default async function AccountOverviewPage() {
  const orders = await getOrders();
  return (
    <AccountOverview recentOrder={orders[0] ?? null} orderCount={orders.length} />
  );
}
