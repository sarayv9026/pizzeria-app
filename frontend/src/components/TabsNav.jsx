export default function TabsNav({ view, onChange }) {
  return (
    <div className="tabs">
      <button className={`tab ${view === 'catalog' ? 'active' : ''}`} onClick={() => onChange('catalog')}>
        Catálogo
      </button>
      <button className={`tab ${view === 'orders' ? 'active' : ''}`} onClick={() => onChange('orders')}>
        Mis pedidos
      </button>
      <button className={`tab ${view === 'collab' ? 'active' : ''}`} onClick={() => onChange('collab')}>
        Colaboradores
      </button>
    </div>
  );
}
