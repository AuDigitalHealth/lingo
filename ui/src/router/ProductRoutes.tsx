import { Route, Routes } from 'react-router-dom';
import ProductModelView from '../pages/products/ProductModelView.tsx';

function ProductRoutes() {
  return (
    <Routes>
      <Route path="/:id" element={<ProductModelView />} />
    </Routes>
  );
}

export default ProductRoutes;
