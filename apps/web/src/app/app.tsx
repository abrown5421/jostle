import { AnimatedRoutes } from '@jostle/router';
import { BrowserRouter } from 'react-router';
import { routes } from './routes.js';

export function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes routes={routes} />
    </BrowserRouter>
  );
}

export default App;
