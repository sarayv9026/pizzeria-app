export default function CollabList({ orders, onUpdate }) {
  return (
    <section className="panel">
      <div className="collab-bar">
        <p>Pedidos en cola ({orders.length})</p>
      </div>
      <div className="order-list">
        {orders.length === 0 && <p>Sin pedidos pendientes.</p>}
        {orders.map((o) => (
          <div key={o.orderId} className="order-row">
            <div>
              <div className="order-row-header">
                <p className="order-id">{o.orderId}</p>
                <span className={`badge ${o.estado.toLowerCase()}`}>{o.estado}</span>
              </div>
              <p className="order-meta">{o.items?.length || 0} items</p>
              <p className="order-meta">
                Cliente: {o.cliente?.clienteId || o.clienteId || 'N/D'}
              </p>
              {o.items && o.items.length > 0 && (
                <ul className="order-items">
                  {o.items.map((it) => (
                    <li key={`${o.orderId}-${it.productoId}-${it.nombre}`}>{it.nombre} x {it.cantidad}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="collab-actions">
              <button className="btn ghost" onClick={() => onUpdate(o.orderId, 'EN_PREPARACION')}>En preparación</button>
              <button className="btn mark-ready" onClick={() => onUpdate(o.orderId, 'LISTO')}>Marcar listo</button>
              <button className="btn primary" onClick={() => onUpdate(o.orderId, 'ENTREGADO')}>Entregado</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
