// import Router from './router/Router';
import Router, { browserRouter } from './router';
import './app.css';
import { store } from './store';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter, RouterProvider } from 'react-router-dom';

function App() {
  return (
    <ReduxProvider store={store}>
      {/* <BrowserRouter> */}
      {/* <Router /> */}
      <RouterProvider router={browserRouter} />
      {/* </BrowserRouter> */}
    </ReduxProvider>
  );
}

export default App;
