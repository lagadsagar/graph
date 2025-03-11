import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_MATCHED_MATERIALS } from './queries';
function App() {
  const { loading, error, data } = useQuery(GET_MATCHED_MATERIALS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="App">
      <h1>Material Management</h1>
      <div className="materials">
        {data?.getMatchedMaterials?.map((material, index) => (
          <div key={index} className="material-card">
            <h2>{material.name}</h2>
            <p>UOM: {material.uom}</p>
            <p>Quantity: {material.quantity}</p>
            <p>Delivery Date: {material.delivery_date}</p>
            <h3>Characteristics:</h3>
            <ul>
              {material.char?.map((c, idx) => (
                <li key={idx}>
                  {c.name}: {c.value || 'N/A'}
                </li>
              ))}
            </ul>
            {material.rm && material.rm.length > 0 && (
              <>
                <h3>Raw Materials:</h3>
                <ul>
                  {material.rm.map((rm, rmIdx) => (
                    <li key={rmIdx}>
                      {rm.name} - {rm.quantity} {rm.uom}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
function AppWrapper() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

export default AppWrapper;