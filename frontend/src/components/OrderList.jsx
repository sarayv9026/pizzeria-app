export default function OrderList({ title, orders }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      <div className="order-list">
        {orders.length === 0 && <p className="muted">No hay pedidos.</p>}
        {orders.map((o) => (
          <div key={o.orderId} className="order-row">
            <div>
              <p className="order-id">{o.orderId}</p>
              <p className="order-meta">
                {o.fechaCreacion ? new Date(o.fechaCreacion).toLocaleString() : ''}
              </p>
              <p className="order-meta">
                Cliente: {o.cliente?.clienteId || o.clienteId || 'N/D'}
              </p>
            </div>
            <span className={`badge ${o.estado.toLowerCase()}`}>{o.estado}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
