import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createInithiumStore } from '@inithium/store';
import { bootstrapRegistry } from '@inithium/router';
import 'animate.css';
import './styles.css';
import App from './app/app';

bootstrapRegistry(
  import.meta.glob('../../../packages/pages/src/lib/**/*.tsx', { eager: false }) as any,
);

const store = createInithiumStore();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
          <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);