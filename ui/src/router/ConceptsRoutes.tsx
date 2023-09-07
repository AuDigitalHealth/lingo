import { Route, Routes } from 'react-router-dom';
import ConceptEdit from '../pages/concepts/ConceptEdit.tsx';

function ConceptsRoutes() {
  return (
    <Routes>
      <Route path="edit/:id" element={<ConceptEdit />} />
    </Routes>
  );
}

export default ConceptsRoutes;
