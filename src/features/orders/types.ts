export type OrderStatusValue = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface IOrderItem {
  course: string;
  title: string;
  price: number;
}

export interface IOrder {
  _id: string;
  student: string;
  items: IOrderItem[];
  coupon?: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatusValue;
  paidAt?: string;
  createdAt: string;
}
