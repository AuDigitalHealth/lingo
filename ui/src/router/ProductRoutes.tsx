import { Route, Routes } from 'react-router-dom';
import ProductModelView from '../pages/products/ProductModelView.tsx';
import ProductAuthoring from '../pages/products/ProductAuthoring.tsx';

function ProductRoutes() {
  return (
    <Routes>
      <Route path="/:id" element={<ProductModelView />} />
      <Route path="/authoring" element={<ProductAuthoring />} />
    </Routes>
  );
}

export default ProductRoutes;
