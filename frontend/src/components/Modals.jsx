export function ProductModal({ product, qty, loading, onClose, onQtyChange, onAdd }) {
  if (!product) return null;
  return (
    <div className="overlay">
      <div className="modal info">
        <button className="close" onClick={onClose}>×</button>
        <div className="info-content">
          <div className="modal-image">
            <img src={product.imagen} alt={product.nombre} />
          </div>
          <div className="modal-text">
            <h2>{product.nombre}</h2>
            <p className="modal-price">${product.precio}</p>
            <h4>Ingredientes</h4>
            <ul>
              {product.ingredientes.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
            <div className="qty">
              <label htmlFor="qty">Cantidad</label>
              <input id="qty" type="number" min="1" value={qty} onChange={(e) => onQtyChange(Number(e.target.value))} />
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={onClose}>Volver</button>
              <button className="btn primary" disabled={loading} onClick={() => onAdd(product, qty)}>Agregar al carrito</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmationModal({ confirmation, onClose }) {
  if (!confirmation) return null;
  const total = confirmation.items.reduce((acc, c) => acc + c.qty * c.product.precio, 0);
  return (
    <div className="overlay">
      <div className="modal confirm">
        <button className="close" onClick={onClose}>×</button>
        <div className="confirm-header">
          <div className="check">✔</div>
          <div>
            <h2>Orden confirmada</h2>
            <p className="order-number">{confirmation.orderId}</p>
          </div>
        </div>

        <div className="confirm-body">
          <div className="confirm-left">
            <img src={confirmation.product.imagen} alt={confirmation.product.nombre} className="confirm-img" />
          </div>
          <div className="confirm-right">
            <p className="summary-name">{confirmation.product.nombre}</p>
            <p className="summary-price">${confirmation.product.precio}</p>
            <ul className="summary-ingredients">
              {confirmation.product.ingredientes.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="summary-list">
          {confirmation.items.map((c) => (
            <div key={c.product.id} className="summary-row">
              <span>{c.qty} x {c.product.nombre}</span>
              <span>${c.qty * c.product.precio}</span>
            </div>
          ))}
          <div className="summary-row total">
            <strong>Total</strong>
            <strong>${total}</strong>
          </div>
        </div>

        <p className="note">Tu orden podría tomar entre 15 a 20 minutos. Gracias por tu paciencia.</p>
        <button className="btn primary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
