// import Router from './router/Router';
import Router from './router';
import './app.css';
import { store } from './store';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <ReduxProvider store={store}>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </ReduxProvider>
  );
}

export default App;
