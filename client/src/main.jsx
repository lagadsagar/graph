
import React from "react";
import ReactDOM from "react-dom/client"; 
import { ApolloProvider } from "@apollo/client";
import client from "./ApolloClient"; 
import App from "./App";
import './index.css'; // If you have any CSS

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
