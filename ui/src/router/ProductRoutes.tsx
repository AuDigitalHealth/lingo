import { Route, Routes } from 'react-router-dom';
import ProductModelView from '../pages/products/ProductModelView.tsx';
import ProductAuthoring from '../pages/products/ProductAuthoring.tsx';
import ProductModelReadonly from '../pages/products/ProductModelReadonly.tsx';

function ProductRoutes() {
  return (
    <Routes>
      <Route path="/:id/authoring" element={<ProductAuthoring />} />
      <Route path="/authoring" element={<ProductAuthoring />} />
      <Route path="/:id" element={<ProductModelView />} />
      <Route path="/" element={<ProductModelReadonly />} />
    </Routes>
  );
}

export default ProductRoutes;
