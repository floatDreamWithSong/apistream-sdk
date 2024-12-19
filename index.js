
import { configFn } from './src/apistream/config.js';
configFn().then(r=>console.log(r.data)).then(console.error);
export {

}
