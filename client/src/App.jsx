
import React from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_MATERIALS = gql`
  query GetMaterials {
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

  const exportToCSV = () => {
    if (!data?.getMatchedMaterials?.length) return;
    
    // Create CSV headers
    const headers = ['Name', 'UOM', 'Quantity', 'Delivery Date', 'Characteristics'];
    
    // Create CSV rows
    const rows = data.getMatchedMaterials.map(material => {
      const chars = material.char.map(c => `${c.name}: ${c.value || 'N/A'}`).join('; ');
      return [
        material.name,
        material.uom,
        material.quantity,
        material.delivery_date,
        chars
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'materials_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="App container mt-4">
      <h1 className="mb-4">GraphQL Material Management</h1>
      <h2>Materials Data</h2>

      <div className="mb-3">
        <button className="btn btn-primary" onClick={exportToCSV}>Download CSV</button>
        <button className="btn btn-secondary ms-2" onClick={() => refetch()}>Refresh Data</button>
      </div>
      
      {data?.getMatchedMaterials?.length ? (
        <ul className="list-group">
          {data.getMatchedMaterials.map((material, index) => (
            <li key={index} className="list-group-item">
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
    </div>
  );
}

export default App;
