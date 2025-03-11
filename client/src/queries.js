import { gql } from '@apollo/client';

export const GET_MATCHED_MATERIALS = gql`
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
      rm {
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
  }
`;
