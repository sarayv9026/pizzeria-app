import OrderList from '../components/OrderList.jsx';
import ReadyBoard from '../components/ReadyBoard.jsx';

export default function OrdersPage({ userOrders, readyOrders }) {
  return (
    <>
      <OrderList title="Mis pedidos" orders={userOrders} />
      <ReadyBoard orders={readyOrders} />
    </>
  );
}
