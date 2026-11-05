import * as data from '../../app/api/data/route';
import * as ingest from '../../app/api/whatsapp/route';
import * as routing from '../../app/api/whatsapp-routing/route';
import * as config from '../../app/api/whatsapp-config/route';
import * as inbox from '../../app/api/test-inbox/route';
import * as expenses from '../../app/api/expense-inbox/route';
import * as receipts from '../../app/api/whatsapp-receipts/route';
const routes:Record<string,any>={'/api/data':data,'/api/whatsapp':ingest,'/api/whatsapp-routing':routing,'/api/whatsapp-config':config,'/api/test-inbox':inbox,'/api/expense-inbox':expenses,'/api/whatsapp-receipts':receipts};
export default {fetch(r:Request){const handler=routes[new URL(r.url).pathname]?.[r.method];return handler?handler(r):new Response(null,{status:404});}};
