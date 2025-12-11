import ProductCard from '../components/ProductCard.jsx';
import CartPanel from '../components/CartPanel.jsx';

export default function CatalogPage({
  products,
  cart,
  loading,
  onAddToCart,
  onOpenDetail,
  onUpdateQty,
  onRemove,
  onConfirm,
  onClear
}) {
  return (
    <div className={`catalog-layout ${cart.length > 0 ? 'with-cart' : 'no-cart'}`}>
      <section className="grid">
        {products.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            loading={loading}
            onDetail={onOpenDetail}
            onAdd={onAddToCart}
            delay={idx * 0.15}
          />
        ))}
      </section>
      <CartPanel
        cart={cart}
        total={cart.reduce((acc, c) => acc + c.product.precio * c.qty, 0)}
        loading={loading}
        onUpdateQty={onUpdateQty}
        onRemove={onRemove}
        onConfirm={() => onConfirm(cart)}
        onClear={onClear}
      />
    </div>
  );
}
