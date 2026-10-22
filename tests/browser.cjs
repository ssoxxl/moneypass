const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();}else{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});res.end(data);}});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({channel:'chrome',headless:true});
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
  let count=0;
  try{
    const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'guides')).filter(f=>f.endsWith('.html')).map(f=>'guides/'+f)];
    for(const width of [320,360,768,1440]){
      const context=await browser.newContext({viewport:{width,height:1000}});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
      await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      for(const file of files){
        await page.goto(base+'/'+file);await page.locator('h1').waitFor();
        assert.equal(await page.locator('h1').count(),1,file);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${file} width=${width}`);
        const missing=await page.evaluate(()=>[...document.querySelectorAll('label[for]')].filter(l=>!document.getElementById(l.htmlFor)).map(l=>l.htmlFor));assert.deepEqual(missing,[]);
        count++;
      }
      await page.goto(base+'/index.html');await page.locator('#diag-age').fill('70');await page.locator('#diag-closed').check();await page.locator('#diagnostic-form button').click();
      assert.equal(await page.locator('[data-policy-id="youth-rent-2026"]').count(),0);
      await page.locator('#diag-interest').selectOption('housing');await page.locator('#diagnostic-form button').click();assert.ok(await page.locator('.empty-state').isVisible());
      await page.locator('#diag-age').fill('29');await page.locator('#diag-house').selectOption('rent');await page.locator('#diagnostic-form button').click();assert.ok(await page.locator('[data-policy-id="youth-rent-2026"]').isVisible());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.goto(base+'/calculator.html');
      for(const key of ['unemployment','freelancer','youth','health','severance','pension','yearend']){
        await page.locator(`[data-tab="${key}"]`).click();
        assert.equal(await page.locator('.calc-panel:visible').count(),1);
        if(key==='health')await page.locator('#hi-ceiling').fill('1500000');
        const form=page.locator(`form[data-calculator="${key}"]`);await form.locator('button[type="submit"]').click();
        assert.ok(await form.locator('.calc-result').isVisible(),key+' result');assert.ok(!await form.locator('.form-error').isVisible(),key+' error');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),key+' result overflow');
      }
      await page.locator('#ye-salary').fill('-1');await page.locator('#yearend button[type=submit]').click();assert.ok(await page.locator('#yearend .form-error').isVisible());assert.ok(!await page.locator('#yearend .calc-result').isVisible());
      await page.goto(base+'/calculator.html?tab=health');await page.locator('#health button[type=submit]').click();assert.ok(await page.locator('#health .form-error').isVisible());
      await page.goto(base+'/contact.html');assert.ok(await page.locator('#contact-send').isEnabled());assert.equal(await page.locator('#contact-success').count(),0);assert.ok((await page.locator('.contact-email').innerText()).includes('ssoxxl2u@gmail.com'));
      await page.goto(base+'/guide-detail.html?id=guide-youth-leap-vs-savings');await page.waitForURL('**/guides/guide-youth-leap-vs-savings.html');
      await page.goto(base+'/calculator.html?tab=unknown');assert.ok(await page.locator('#unemployment').isVisible());
      await page.locator('[data-tab=pension]').click();await page.goBack();assert.ok(await page.locator('#unemployment').isVisible());
      await page.goto(base+'/calculator.html?tab=youthleap');assert.ok(await page.locator('#youth').isVisible());
      await page.goto(base+'/guide-detail.html?id=guide-national-pension-tips');await page.waitForURL('**/guides/guide-retirement-planning.html');
      await page.goto(base+'/index.html');await page.screenshot({path:path.join(root,`artifacts/home-${width}.png`),fullPage:true});
      const homeAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(homeAudit.violations.map(v=>({id:v.id,impact:v.impact})),[],'home accessibility');
      await page.goto(base+'/calculator.html?tab=severance');await page.locator('#severance button[type=submit]').click();await page.screenshot({path:path.join(root,`artifacts/calculator-${width}.png`),fullPage:true});
      const calcAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(calcAudit.violations.map(v=>({id:v.id,impact:v.impact})),[],'calculator accessibility');
      assert.deepEqual(errors,[],`browser errors width=${width}`);await context.close();
    }
    const nojs=await browser.newContext({javaScriptEnabled:false});const p=await nojs.newPage();await p.goto(base+'/guides/guide-health-refund.html');assert.ok((await p.locator('article').innerText()).includes('제외'));await nojs.close();
    const configured=await browser.newPage();
    const ads={client:'ca-pub-1234567890123456',autoAds:true,loadScript:true};
    const production='https://preview.moneypass.test';
    await configured.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin===production){const response=await route.fetch({url:base+url.pathname+url.search});await route.fulfill({response});}else if(url.origin===base) await route.continue();else await route.abort();
    });
    await configured.route('**/assets/js/config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.MONEYPASS_CONFIG='+JSON.stringify({contactEmail:'support@example.com',adsense:ads})}));
    await configured.goto(production+'/index.html');assert.equal(await configured.locator('ins.adsbygoogle').count(),0);assert.equal(await configured.locator('script[src*="adsbygoogle.js"]').count(),1);
    assert.ok((await configured.locator('script[src*="adsbygoogle.js"]').getAttribute('src')).includes(ads.client));
    await configured.goto(production+'/contact.html');assert.ok(await configured.locator('#contact-send').isEnabled());
    await configured.setContent(`<iframe src="${production}/index.html"></iframe>`);const frame=await(await configured.locator('iframe').elementHandle()).contentFrame();await frame.waitForLoadState();assert.equal(await frame.locator('script[src*="adsbygoogle.js"]').count(),0);
    await configured.route('**/assets/js/config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.MONEYPASS_CONFIG={}'}));
    await configured.goto(production+'/contact.html');assert.ok(await configured.locator('#contact-send').isDisabled());
    await configured.goto(base+'/index.html');assert.equal(await configured.locator('script[src*="adsbygoogle.js"]').count(),0);await configured.close();
    console.log(`PASS: ${count} page/viewport checks, all 7 calculators, diagnostic filters, invalid inputs, navigation, legacy URLs, no-JS guide, axe accessibility, ads config and iframe suppression.`);
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
