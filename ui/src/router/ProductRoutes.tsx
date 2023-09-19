import { Route, Routes } from 'react-router-dom';
import ProductModelLayout from '../pages/products/ProductModelLayout.tsx';

function ProductRoutes() {
  return (
    <Routes>
      <Route path="/:id" element={<ProductModelLayout />} />
    </Routes>
  );
}

export default ProductRoutes;
