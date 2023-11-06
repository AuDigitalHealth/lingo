import { Route, Routes } from 'react-router-dom';
import ProductModelView from '../pages/products/ProductModelView.tsx';
import ProductAuthoring from '../pages/products/ProductAuthoring.tsx';

function ProductRoutes() {
  return (
    <Routes>
      <Route path="/:id/authoring" element={<ProductAuthoring ticket={null} task={null}/>} />
      <Route path="/authoring" element={<ProductAuthoring ticket={null} task={null}/>} />
      <Route path="/:id" element={<ProductModelView />} />
    </Routes>
  );
}

export default ProductRoutes;
