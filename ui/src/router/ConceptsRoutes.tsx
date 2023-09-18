import { Route, Routes } from 'react-router-dom';
import ProductModelLayout from '../pages/concepts/ProductModelLayout.tsx';

function ConceptsRoutes() {
  return (
    <Routes>
      <Route path="/:id" element={<ProductModelLayout />} />
    </Routes>
  );
}

export default ConceptsRoutes;
