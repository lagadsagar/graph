
import React from 'react';
import { useQuery, gql } from '@apollo/client';
import './App.css';

const GET_MATERIALS = gql`
  query GetMatchedMaterials {
    getMatchedMaterials {
      name
      uom
      quantity
      delivery_date
      char {
        name
        value
      }
    }
  }
`;

function App() {
  const { loading, error, data, refetch } = useQuery(GET_MATERIALS, {
    fetchPolicy: "network-only"
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>GraphQL Material Management</h1>
        <button onClick={() => refetch()}>Refresh Data</button>
      </header>
      <main>
        <h2>Matched Materials</h2>
        {data?.getMatchedMaterials?.length ? (
          <ul>
            {data.getMatchedMaterials.map((material, index) => (
              <li key={index}>
                <h3>{material.name}</h3>
                <p>UOM: {material.uom}</p>
                <p>Quantity: {material.quantity}</p>
                <p>Delivery Date: {material.delivery_date}</p>
                <h4>Characteristics:</h4>
                <ul>
                  {material.char.map((char, charIndex) => (
                    <li key={charIndex}>
                      {char.name}: {char.value || 'N/A'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>No materials found</p>
        )}
      </main>
    </div>
  );
}

export default App;
