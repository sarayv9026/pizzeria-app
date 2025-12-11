export default function ReadyBoard({ orders }) {
  return (
    <section className="panel">
      <h3>Pedidos listos</h3>
      <div className="ready-board">
        {orders.length === 0 && <p>No hay pedidos listos.</p>}
        {orders.map((o) => (
          <div key={o.orderId} className="ready-card">
            <p className="order-id">{o.orderId}</p>
            <div className="ready-image">
              <img src="/pizza.png" alt="Pizza" />
            </div>
            <div className="ready-info">
              <p>Cliente: {o.clienteId || o.cliente?.clienteId || '—'}</p>
              {o.items && o.items.length > 0 && (
                <ul className="order-items ready">
                  {o.items.map((it) => (
                    <li key={`${o.orderId}-${it.productoId}-${it.nombre}`}>{it.nombre} x {it.cantidad}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
