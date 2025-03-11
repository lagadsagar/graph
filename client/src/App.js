import React, { useState } from 'react';
import './App.css';
import { ApolloProvider, useQuery } from '@apollo/client';
import client from './ApolloClient';
import { GET_MATCHED_MATERIALS } from './queries';

function App() {
  // State for filters
  const [filters, setFilters] = useState({});

  const { loading, error, data } = useQuery(GET_MATCHED_MATERIALS, { client });

  // Handle loading and error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error! {error.message}</div>;

  console.time("table time");

  const processDataForTable = (data, filters) => {
    const columnNames = new Set();
    const allRows = [];

    data.getMatchedMaterials.forEach((material) => {
      // Process the main material row
      const materialRow = {
        material: material.name,
        uom: material.uom,
        quantity: material.quantity,
        delivery_date: material.delivery_date,
      };

      // Add dynamic attributes from 'char' for the material
      material.char.forEach((char) => {
        columnNames.add(char.name);
        materialRow[char.name] = char.value;
      });

      allRows.push(materialRow); // Add the main material row

      // Process each raw material (rm)
      material.rm.forEach((rm) => {
        const rawMaterialRow = {
          material: rm.name,
          uom: rm.uom,
          quantity: rm.quantity,
          delivery_date: rm.delivery_date,
        };

        // Add dynamic attributes from 'char' for each raw material
        rm.char.forEach((char) => {
          columnNames.add(char.name);
          rawMaterialRow[char.name] = char.value;
        });

        allRows.push(rawMaterialRow); // Add the raw material row
      });
    });

    console.timeEnd("table time");

    return {
      rows: allRows,
      columnNames: Array.from(columnNames),
    };
  };

  const { rows, columnNames } = processDataForTable(data, filters);

  // Handle filter change
  const handleFilterChange = (column, value) => {
    if (value === '') {
      // Remove the filter if the input is empty
      const newFilters = { ...filters };
      delete newFilters[column];
      setFilters(newFilters);
    } else {
      // Update the filter with the new value
      setFilters({ ...filters, [column]: value.toLowerCase() });
    }
  };

  // Filter rows based on input
  const filteredRows = rows.filter((row) =>
    Object.keys(filters).every((key) =>
      row[key]?.toString().toLowerCase().includes(filters[key])
    )
  );

  const exportToCSV = () => {
    const header = ['Material', 'UOM', 'Quantity', 'Delivery_Date', ...columnNames];
    const rowsData = filteredRows.map((row) => [
      row.material,
      row.uom,
      row.quantity,
      row.delivery_date,
      ...columnNames.map((colName) => row[colName] || ''),
    ]);

    const csvContent = [
      header.join(','),
      ...rowsData.map(row => row.join(',')),
    ].join('\n');

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

  return (
    <div className="App container mt-4">
      <h1 className="mb-4">GraphQL</h1>
      <h2>Materials Data</h2>

      <div className="mb-3">
        <button className="btn btn-primary" onClick={exportToCSV}>Download CSV</button>
      </div>

      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Material</th>
            <th>UOM</th>
            <th>Quantity</th>
            <th>Delivery_Date</th>
            {columnNames.map((colName, index) => (
              <th key={index}>{colName}</th>
            ))}
          </tr>
          <tr>
            <th><input className="form-control" type="text" placeholder="Filter" onChange={(e) => handleFilterChange('material', e.target.value)} /></th>
            <th><input className="form-control" type="text" placeholder="Filter" onChange={(e) => handleFilterChange('uom', e.target.value)} /></th>
            <th><input className="form-control" type="text" placeholder="Filter" onChange={(e) => handleFilterChange('quantity', e.target.value)} /></th>
            <th><input className="form-control" type="text" placeholder="Filter" onChange={(e) => handleFilterChange('delivery_date', e.target.value)} /></th>
            {columnNames.map((colName, index) => (
              <th key={index}>
                <input className="form-control" type="text" placeholder="Filter" onChange={(e) => handleFilterChange(colName, e.target.value)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, index) => (
            <tr key={index}>
              <td>{row.material}</td>
              <td>{row.uom}</td>
              <td>{row.quantity}</td>
              <td>{row.delivery_date}</td>
              {columnNames.map((colName, index) => (
                <td key={index}>{row[colName] || ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppWrapper() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

export default AppWrapper;
