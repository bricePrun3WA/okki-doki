import { combineReducers } from 'redux';

import reducerSession from './session';
import reducerLoad from './load';
import reducerToast from './toast';

export default combineReducers({
    reducerSession : reducerSession,
    reducerLoad : reducerLoad,
    reducerToast: reducerToast
});