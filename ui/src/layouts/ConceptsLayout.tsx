import { Route, Routes } from 'react-router-dom';
import ConceptEditLayout from './ConceptEditLayout.tsx';

function ConceptsLayout() {
  return (
    <Routes>
      <Route path="edit/:id" element={<ConceptEditLayout />} />
    </Routes>
  );
}

export default ConceptsLayout;
