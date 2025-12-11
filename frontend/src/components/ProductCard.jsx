export default function ProductCard({ product, loading, onDetail, onAdd, delay = 0 }) {
  const imgStyle = delay ? { animationDelay: `${delay}s` } : undefined;
  return (
    <article className="card">
      <div className="card-top">
        <span className={`pill pill-${product.tipo || 'pizza'}`}>{product.tipo === 'bebida' ? 'Bebida' : 'Pizza'}</span>
        <span className="pill price-pill">${product.precio}</span>
      </div>
      <div className="card-media">
        <img className="product-img" style={imgStyle} src={product.imagen} alt={product.nombre} />
      </div>
      <div className="card-body">
        <h3>{product.nombre}</h3>
        <p className="description">{product.descripcion}</p>
        <div className="actions">
          <button className="btn ghost" onClick={() => onDetail(product)}>Ver detalle</button>
          <button className="btn primary" disabled={loading} onClick={() => onAdd(product)}>Agregar</button>
        </div>
      </div>
    </article>
  );
}
