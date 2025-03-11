
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const normalize = (str) => str.trim().toLowerCase();
const normalize = (str) => {
  if (typeof str !== "string") {
      return "";
  }
  return str.trim().toLowerCase();
};

// connect to MongoDB and start the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphql';

// Try to connect to MongoDB, but start server regardless to allow frontend development
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    startServer();
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
    console.log('Starting server without MongoDB connection...');
    startServer();
  });

// Build raw materials hierarchy iteratively (non-recursive)
const buildRmHierarchy = (rawMaterials) => {
  const stack = [...rawMaterials];
  const result = [];

  while (stack.length) {
    const rm = stack.pop();
    const validQuantity = !isNaN(rm.quantity) ? rm.quantity : 0;
    const validPrice = !isNaN(rm.price) ? rm.price : 0;

    const updatedRm = {
      ...rm,
      quantity: validQuantity,
      price: validPrice,
      rm: [],
    };

    if (rm.rm) {
      stack.push(...rm.rm);
      updatedRm.rm = null;
    }

    result.push(updatedRm);
  }

  return result;
};

const applyCustomerQuantity = (material, customerQuantity) => {
  const validCustomerQuantity = !isNaN(customerQuantity) ? customerQuantity : 0;

  const updatedMaterial = {
    ...material,
    quantity: material.quantity * validCustomerQuantity,
    price: material.price * validCustomerQuantity,
  };

  if (updatedMaterial.rm) {
    updatedMaterial.rm = updatedMaterial.rm.map((rm) => applyCustomerQuantity(rm, validCustomerQuantity)); // Recursive call
  }

  return updatedMaterial;
};

async function startServer() {
  const app = express();

  const typeDefs = `
    type Char {
      name: String!
      value: String
    }

    type RawMaterial {
      name: String!
      uom: String!
      quantity: Int!
      delivery_date: String!
      price: Float!
      char: [Char]!
      rm: [RawMaterial]
    }

    type Material {
      name: String!
      uom: String!
      quantity: Int!
      delivery_date: String!
      char: [Char]!
      rm: [RawMaterial]
    }

    type Query {
      getMatchedMaterials: [Material]!
    }
  `;

  console.time("dataloading")
  const [customerData, materialData, CharacteristicsData] = await Promise.all([  
    mongoose.connection.db.collection('TEST').find().toArray(),
    mongoose.connection.db.collection('BOM_hierarchy_1lakh').find().toArray(),
    mongoose.connection.db.collection('Material_Characteristics_4lakh').find().toArray(),
  ]);

  console.timeEnd("dataloading")

  const resolvers = {
    Query: {
      getMatchedMaterials: async () => {

        console.time("dataProcessingTime");

        const materialIndex = materialData.reduce((index, material) => {
          const key = normalize(material.name + material.uom);
          if (!index[key]) {
            index[key] = [];
          }
          index[key].push(material);
          return index;
        }, {});

        const CharacteristicsIndex = CharacteristicsData.reduce((index, material) => {
          const key = normalize(material.name);
          index[key] = material.char || [];
          return index;
        }, {});

        const mergeMaterialCharValues = (material) => {
          const materialChar = CharacteristicsIndex[normalize(material.name)] || [];

          if (materialChar.length > 0) {
            material.char = [];
            materialChar.forEach((char) => {
              material.char.push({
                name: char.name,
                value: char.value || '',
              });
            });
          }

          if (material.rm) {
            material.rm.forEach((rm) => {
              mergeMaterialCharValues(rm);
            });
          }
        };

        const mergeCustomerCharValues = (material, customer) => {

          if (customer.delivery_date) {
            material.delivery_date = customer.delivery_date;
          }
          const customerChar = customer.char || [];
          const materialChar = material.char || [];


          if (customerChar.length > materialChar.length) {
            return null;
            }


          let allCharsMatch = true;

          customerChar.forEach((customerCharItem) => {
            const materialCharItem = materialChar.find(c => normalize(c.name) === normalize(customerCharItem.name));

            if (!materialCharItem) {
              allCharsMatch = false;
            }
          });

          if (allCharsMatch) {
            materialChar.forEach((char) => {
              const customerCharItem = customerChar.find(c => normalize(c.name) === normalize(char.name));

              if (customerCharItem) {
                char.value = customerCharItem.value; 
              }else{
                char.value = '' 
              }
            });

            if (material.rm && Array.isArray(material.rm)) {
              material.rm.forEach((rm) => {
                rm.char?.forEach((rmChar) => {
                  const customerCharItem = customerChar.find(c => normalize(c.name) === normalize(rmChar.name));

                  if (customerCharItem) {
                    rmChar.value = customerCharItem.value;
                  }
                });

                mergeCustomerCharValues(rm, customer);
              });
            }

            return material; 
          }

          return null; 
        };

        // Function to merge material char for specific finished goods (fg) to avoid overwriting
        const mergeMaterialCharForFg = (material, BOM) => {
          if (material.rm) {
            material.rm.forEach((rm) => {
              if (normalize(rm.name) === normalize(rm.name)) {
                if (!rm.char || rm.char.length === 0) {
                  rm.char = BOM.char;
                }
              }
              mergeMaterialCharForFg(rm, BOM);
            });
          }
        };

        const matchedMaterials = [];

        // Iterate over each customer
        customerData.forEach((customer) => {
          customer.line_items.forEach((customer) => {
            const { name, uom, char, quantity: customerQuantity, delivery_date } = customer;
            const validCustomerQuantity = !isNaN(customerQuantity) ? customerQuantity : 0;

            // Find matching materials based on customer name and uom
            const matchedMaterialsForCustomer = materialIndex[normalize(name + uom)] || [];

            // Iterate over all matched materials for the customer
            matchedMaterialsForCustomer.forEach((material) => {
              // Process raw materials hierarchy (if needed)
              if (material.rm) {
                material.rm = buildRmHierarchy(material.rm);
              }

              // Merge combine data char values into material
              mergeMaterialCharValues(material);

              // Merge customer char values into the material
              mergeCustomerCharValues(material, customer);

              // Merge material char based on FG context
              mergeMaterialCharForFg(material, customer);

              // Apply customer quantity multiplication to both FG and RM after processing
              const updatedMaterial = applyCustomerQuantity(material, validCustomerQuantity);

              // Aggregate quantities and char if materials match
              const existingMaterialIndex = matchedMaterials.findIndex(
                (mat) => normalize(mat.name + mat.uom) === normalize(updatedMaterial.name + updatedMaterial.uom) &&
                        JSON.stringify(mat.char) === JSON.stringify(updatedMaterial.char) && mat.delivery_date === updatedMaterial.delivery_date
              );

              if (existingMaterialIndex !== -1) {
                const existingMaterial = matchedMaterials[existingMaterialIndex];
                existingMaterial.quantity += updatedMaterial.quantity;

                if (updatedMaterial.rm) {
                  updatedMaterial.rm.forEach((rm) => {
                    const existingRmIndex = existingMaterial.rm.findIndex(
                      (existingRm) => normalize(existingRm.name + existingRm.uom) === normalize(rm.name + rm.uom)
                    );
                    if (existingRmIndex !== -1) {
                      existingMaterial.rm[existingRmIndex].quantity += rm.quantity;
                    } else {
                      existingMaterial.rm.push(rm);
                    }
                  });
                }
              } else {
                matchedMaterials.push(updatedMaterial);
              }
            });
          });
        });

        console.timeEnd("dataProcessingTime");

        return matchedMaterials;
      },
    },
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  app.use(bodyParser.json());
  app.use(cors());

  await server.start();

  app.use("/graphql", expressMiddleware(server));

  // Import and use the Vite module
  if (process.env.NODE_ENV === 'production') {
    // In production, serve static files
    const { serveStatic } = await import('./vite.js');
    serveStatic(app);
  } else {
    // In development, use Vite middleware with HMR
    const { setupVite } = await import('./vite.js');
    const httpServer = app.listen(8000, '0.0.0.0', () => {
      console.log("Server started at PORT 8000");
      console.log(`GraphQL API available at http://0.0.0.0:8000/graphql`);
      console.log(`Frontend available at http://0.0.0.0:8000`);
    });
    
    // Pass the http server to setupVite for HMR
    await setupVite(app, httpServer);
    
    return; // Return early since we've already started the server
  }

  // Only reached in production mode
  app.listen(8000, '0.0.0.0', () => {
    console.log("Server started at PORT 8000");
    console.log(`GraphQL API available at http://0.0.0.0:8000/graphql`);
    console.log(`Frontend available at http://0.0.0.0:8000`);
  });
}
