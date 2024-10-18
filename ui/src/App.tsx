// import Router from './router/Router';
import { browserRouter } from './router';
import './app.css';
import { RouterProvider } from 'react-router-dom';

function App() {
  return <RouterProvider router={browserRouter} />;
}

export default App;
