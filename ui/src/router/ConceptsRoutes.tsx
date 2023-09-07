import { Route, Routes } from 'react-router-dom';
import ConceptEditLayout from '../layouts/ConceptEditLayout.tsx';

function ConceptsRoutes() {
  return (
    <Routes>
      <Route path="edit/:id" element={<ConceptEditLayout />} />
    </Routes>
  );
}

export default ConceptsRoutes;
