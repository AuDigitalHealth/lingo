// import Router from './router/Router';
import { browserRouter } from './router';
import './app.css';
import { store } from './store';
import { Provider as ReduxProvider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

function App() {
  return (
    <ReduxProvider store={store}>
      <RouterProvider router={browserRouter} />
    </ReduxProvider>
  );
}

export default App;
