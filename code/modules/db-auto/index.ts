import * as fs from "fs";
import { configValidator } from "./src/configValidator";
import { validate } from "@db-auto/utils";
import { Config } from "./src/config";


function getConfig ( name: string ): Config {
  try {
    const rawConfig = JSON.parse ( fs.readFileSync ( name ).toString ( 'utf8' ) );
    return validate ( "'dbConfig.json'", configValidator, rawConfig,
      config => {
        console.log ( 'Valid!!!', config );
        return config
      },
      errors => {
        console.log ( 'Invalid!!!', errors );
        process.exit ( 1 );
      } )
  } catch ( e ) {
    console.error ( 'Error reading config file: ', name, e );
    process.exit ( 1 );
  }
}
getConfig ( '.dbConfig.json' );


