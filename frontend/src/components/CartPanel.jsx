export default function CartPanel({ cart, total, loading, onUpdateQty, onRemove, onConfirm, onClear }) {
  if (cart.length === 0) return null;
  return (
    <aside className="cart-panel">
      <div className="cart-header">
        <h4>Carrito</h4>
        <span>Total: ${total}</span>
      </div>
      <div className="cart-items scrollable">
        {cart.map((c) => (
          <div key={c.product.id} className="cart-item">
            <div>
              <span className="cart-name">{c.product.nombre}</span>
              <p className="cart-price">${c.product.precio} c/u</p>
            </div>
            <div className="cart-controls">
              <input
                type="number"
                min="1"
                value={c.qty}
                onChange={(e) => onUpdateQty(c.product.id, Number(e.target.value))}
              />
              <button className="btn ghost" onClick={() => onRemove(c.product.id)}>Quitar</button>
            </div>
            <span>${c.product.precio * c.qty}</span>
          </div>
        ))}
      </div>
      <div className="cart-actions">
        <button className="btn ghost" onClick={onClear}>Cancelar</button>
        <button className="btn primary" disabled={loading} onClick={onConfirm}>Confirmar pedido</button>
      </div>
    </aside>
  );
}
