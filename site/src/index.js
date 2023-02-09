import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import {createStore} from "redux";
import {Provider} from "react-redux";
import {disableReactDevTools} from "@fvilers/disable-react-devtools";

import reducer from './redux/reducers/all-reducers';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Pour des questions de sécurité, on peut désactiver la possibilité d'utiliser les outils de développement
disableReactDevTools();

// Store pour la gestion des actions
const store = createStore(reducer);

// A chaque changement du store
store.subscribe(() => {
  const myReducers = store.getState();

  // ... on met à jour la session
  localStorage.setItem('isLogged', JSON.stringify(myReducers.reducerSession.isLogged));

  if (!myReducers?.reducerSession?.isLogged?.client) {
    localStorage.removeItem("clientAddEvent");
    localStorage.removeItem("clientProfileEvents");
  }
})

// Application avec Create React App, React Router et Redux
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
