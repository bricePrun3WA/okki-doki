import logo from './logo.svg';
import './App.css';

import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Header from './components/structure/Header';
import Footer from './components/structure/Footer';

import Home from './components/pages/admin/Home';

import ListUsers from './components/pages/admin/user/ListUsers';
import AddUser from './components/pages/admin/user/AddUser';
import UpdateUser from './components/pages/admin/user/UpdateUser';

import ListCompanies from './components/pages/admin/company/ListCompanies';
import AddCompany from './components/pages/admin/company/AddCompany';
import UpdateCompany from './components/pages/admin/company/update/UpdateCompany';
import UpdateProfile from './components/pages/admin/user/UpdateProfile';

import ListEvents from './components/pages/admin/events/ListEvents';

import Login from './components/pages/admin/user/Login';

import AddEvent from './components/pages/client/events/AddEvent';
import About from './components/pages/client/About';

import AuthCheck from './components/structure/session/AuthCheck';
import ToastMessage from './components/structure/ToastMessage';
import { Fragment, useEffect, useState } from 'react';
import ClientLogin from './components/pages/client/user/ClientLogin';
import ClientUpdateProfile from './components/pages/client/user/ClientUpdateProfile';
import { connexion, deconnexion } from './redux/actions/session-action-types';
import ClientHome from './components/pages/client/ClientHome';
import ClientRegister from './components/pages/client/user/ClientRegister';
import VerifyUser from './components/pages/client/user/VerifyUser';
import UpdateCompanyHours from './components/pages/admin/company/update/UpdateCompanyHours';
import ProfileEvents from './components/pages/client/events/ProfileEvents';
import SentEvent from './components/pages/client/events/SentEvent';

function App() {
  const { myReducerSession, myReducerToast } = useSelector(state => {
    return {
      myReducerSession : state.reducerSession,
      myReducerToast : state.reducerToast
    }
  });

  const location = useLocation();
  const dispatch = useDispatch();
  const [isAdmin, setisAdmin] = useState(location.pathname.split("/")[1] === "admin"); 
  
  // A chaque changement de page...
  useEffect(() => {
    // On vérifie si c'est une page admin
    setisAdmin(location.pathname.split("/")[1] === "admin");

    // On vérifie si la connexion a changé
    fetchCheckSession();
  }, [location]);

  // A chaque changement d'espace'...
  useEffect(() => {
    document.title = isAdmin ? "Espace professionnel - OKKI DOKI" : "OKKI DOKI";
  }, [isAdmin]);

  // Vérification de la connexion
  const fetchCheckSession = () => {
    const reqCheckSession = new Request(`/check-session`, {
      method: 'POST',
      body: JSON.stringify({
        espace: isAdmin ? "admin" : "client"
      }),
      headers: { 'content-type': 'application/json' },
    });
    
    fetch(reqCheckSession)
      .then(res => res.json())
      .then(data => {
        if (data?.isValid) {
          dispatch(connexion({ isLogged: true, espace: isAdmin ? "admin" : "client" }));
        } else {
          dispatch(deconnexion({ done: "ok", espace: isAdmin ? "admin" : "client" }));
        }
      });
  }

  const adminDefaultPages = [];
  if (!myReducerSession?.isLogged?.admin) {
    adminDefaultPages.push(
      <Route path="/admin">
        <Route index element={<Login />} />
        <Route path="*" element={<Login />} />
      </Route>
    );
  } else {
    adminDefaultPages.push(
      <>
        <Route path="/admin">
          <Route element={<AuthCheck roleRequired="admin" espace="admin" />}>
            <Route index element={<Home />} />

            <Route path="/admin/profil" element={<UpdateProfile />} />

            <Route path="/admin/companies" element={<ListCompanies />} />
            <Route path="/admin/company/add" element={<AddCompany />} />
            <Route path="/admin/company/update/general/:id" element={<UpdateCompany />} />
            <Route path="/admin/company/update/hours/:id" element={<UpdateCompanyHours />} />

            <Route path="/admin/events" element={<ListEvents />} />

            <Route path="*" element={<Home />} />
          </Route>
          
          <Route element={<AuthCheck roleRequired="superadmin" espace="admin" />}>
            <Route path="/admin/users" element={<ListUsers />} />
            <Route path="/admin/user/add" element={<AddUser />} />
            <Route path="/admin/user/update/:id" element={<UpdateUser />} />
          </Route>
        </Route>
      </>
    );
  }

  const clientDefaultPages = [
    <>
      <Route path="/" element={<ClientHome />} />

      <Route path="/event/add" element={<AddEvent />} />
      <Route path="/about" element={<About />} />
      <Route path="/my-events/add" element={<AddEvent />} />
      <Route path="/my-events/sent" element={<SentEvent />} />
      <Route path="/verify/:id/:key" element={<VerifyUser />} />

      <Route path="*" element={<ClientHome />} />
    </>
  ];

  if (!myReducerSession?.isLogged?.client) {
    clientDefaultPages.push(
      <>
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/inscription" element={<ClientRegister />} />
      </>
    );
  } else {
    clientDefaultPages.push(
      <>
        <Route element={<AuthCheck roleRequired="client" espace="client" />}>
          <Route path="/profil" element={<ClientUpdateProfile />} />
          <Route path="/my-events/list" element={<ProfileEvents />} />
        </Route>
      </>
    );
  }

  return (
    <>
      <Header isAdmin={isAdmin} />
      <main className={"container ".concat(isAdmin && !myReducerSession?.isLogged?.admin ? 'notLogged' : '')}>
        <Routes> 
          {clientDefaultPages.map((routeList, i) => <Fragment key={i}>{routeList}</Fragment>)}
          {adminDefaultPages.map((routeList, i) => <Fragment key={i}>{routeList}</Fragment>)}
        </Routes>
      </main>
      {myReducerToast.isVisible && (
        <ToastMessage />
      )}
      <Footer />
    </>
  );
}

export default App;
