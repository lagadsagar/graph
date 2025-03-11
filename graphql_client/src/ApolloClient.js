
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// In development or production, GraphQL requests will be proxied to the server
const client = new ApolloClient({
  link: new HttpLink({
    uri: '/graphql', // This will be proxied to the server
  }),
  cache: new InMemoryCache(),
});

export default client;
