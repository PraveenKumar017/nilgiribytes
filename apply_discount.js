const mysql = require('mysql2/promise');
const {URL} = require('url');
require('dotenv').config();
async function main(){
  const u = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({host:u.hostname,port:u.port?Number(u.port):3306,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.replace(/^\//,'')});
  const [rows] = await conn.query('SELECT id,sizes FROM Product');
  for(const r of rows){
    let s = typeof r.sizes==='string'?JSON.parse(r.sizes):r.sizes||[];
    if(Array.isArray(s)){
      const up = s.map(x=>{const m = Number(x.mrpPaise||x.pricePaise); return {...x,mrpPaise:m,discountPercent:10,pricePaise:Math.round(m*0.9)};});
      await conn.execute('UPDATE Product SET sizes=? WHERE id=?',[JSON.stringify(up),r.id]);
    }
  }
  await conn.execute('UPDATE Combo SET discountPercent=10');
  console.log('done');
  await conn.end();
}
main().catch(e=>{console.error(e.message);process.exit(1);});
