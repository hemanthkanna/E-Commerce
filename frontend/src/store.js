import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {thunk} from "redux-thunk";
import ProductsReducer  from "./slices/productsSlice";
import ProductReducer from "./slices/productSlice";
import authReducer from './slices/authSlice';

const reducer = combineReducers({
    productsState: ProductsReducer,
    productState: ProductReducer,
    authState: authReducer
});
const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
});

export default store;
