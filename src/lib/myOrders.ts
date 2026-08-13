export type MyOrderItem = {
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string | null;
  customName: string | null;
  customNumber: string | null;
  patchLabel: string | null;
  patchExtraPrice: number | null;
};

export type MyCustomItem = {
  reference: string;
  fabric: string;
  size: string;
  patch: string | null;
  number: string | null;
  name: string | null;
};

export type MyOrder = {
  publicId: string;
  kind: "Stock" | "Custom";
  status: string;
  total: number;
  paymentMethod: string | null;
  createdAt: string;
  items: MyOrderItem[];
  customItems: MyCustomItem[];
};

export async function getMyOrders(): Promise<MyOrder[]> {
  const res = await fetch("/api/my/orders", { cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}
