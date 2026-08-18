import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{if(m.type()==='error'&&!/video|cloudfront|Failed to load resource/i.test(m.text()))errs.push('CONSOLE '+m.text());});
await p.goto('http://127.0.0.1:8899/koi-world-live.html',{waitUntil:'load'});
await p.waitForTimeout(1500);
// scroll into products hold and screenshot
const y = await p.evaluate(()=>{const s=document.getElementById('products');return s.offsetTop+Math.max(s.offsetHeight-innerHeight,1)*0.46;});
await p.evaluate(yy=>scrollTo({top:yy,behavior:'instant'}),y);
await p.waitForTimeout(900);
await p.screenshot({path:'/tmp/live_products.png'});
const state = await p.evaluate(()=>({reveal:getComputedStyle(document.documentElement).getPropertyValue('--reveal'),lock:document.getElementById('products').classList.contains('lock'),words:document.querySelectorAll('#products .w').length}));
console.log('errors:', errs.length?errs.slice(0,5).join(' | '):'none');
console.log('state:', JSON.stringify(state));
await b.close();
