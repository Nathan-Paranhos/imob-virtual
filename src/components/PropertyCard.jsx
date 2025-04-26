// src/components/PropertyCard.jsx
const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

const PropertyCard = ({ imovel }) => {
  return (
    <div className="property-card">
      <img 
        src={imovel.fotoPrincipal} 
        alt={imovel.titulo} 
        className="property-image"
      />
      <div className="property-details">
        <h3>{imovel.titulo}</h3>
        <p className="property-value">
          {formatarValor(imovel.valor)}
        </p>
        {/* ... outros campos */}
      </div>
    </div>
  );
};