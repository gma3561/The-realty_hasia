// Run a direct Playwright script to verify the Update flow with a mocked Supabase client.
import path from 'path';
import { chromium } from 'playwright';
import fs from 'fs/promises';

function fileUrl(rel) {
  const abs = path.resolve(process.cwd(), rel);
  return 'file://' + abs;
}

function supabaseInitScript(mockData) {
  return `
    (function(){
      window.__CONFIG__ = { supabase: { url: 'mock', anonKey: 'mock' } };
      const persisted = (() => {
        try {
          const raw = window.localStorage.getItem('mock_db_properties');
          return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
      })();
      const db = { properties: persisted || ${JSON.stringify(mockData)} };
      function persist(){ try { window.localStorage.setItem('mock_db_properties', JSON.stringify(db.properties)); } catch(_){} }
      function Table(name){ this.name = name; this._update=null; this._insert=null; this._eq=null; this._selectCols=null; }
      Table.prototype.select = function(arg){
        // If called with columns, behave like a builder (chainable)
        if (typeof arg === 'string' || Array.isArray(arg)) {
          this._selectCols = arg;
          return this;
        }
        // Terminal select() with no args: execute
        if (this._update){
          const idx=(db[this.name]||[]).findIndex(x=>String(x[this._eq.f])===String(this._eq.v));
          if(idx<0) return Promise.resolve({ data: null, error: { message: 'not found' } });
          db[this.name][idx] = { ...db[this.name][idx], ...this._update };
          persist();
          return Promise.resolve({ data:[db[this.name][idx]], error:null });
        }
        if (this._insert){
          const rows=Array.isArray(this._insert)?this._insert:[this._insert];
          (db[this.name]=db[this.name]||[]).push(...rows);
          persist();
          return Promise.resolve({ data: rows, error:null });
        }
        const rows=(db[this.name]||[]);
        return Promise.resolve({ data: rows, error: null, count: rows.length });
      };
      Table.prototype.eq = function(f,v){ this._eq={f,v}; return this; };
      Table.prototype.single = async function(){
        const r=(db[this.name]||[]).find(x=>String(x[this._eq.f])===String(this._eq.v));
        return r?{data:r,error:null}:{data:null,error:{message:'not found'}};
      };
      Table.prototype.update = function(obj){ this._update=obj; return this; };
      Table.prototype.insert = function(rows){ this._insert=rows; return this; };
      // selectAfter no longer needed
      const client={ from(n){ return new Table(n); } };
      window.supabase={ createClient(){ return client; } };
      // Make client immediately available for code that reads it directly
      window.supabaseClient = client;
      // Provide minimal helpers so callers don't depend on supabase-config wiring

      window.getPropertyById = async function(id){
        const { data, error } = await client.from('properties').eq('id', id).single();
        return { success: !error, data, error };
      };
      window.updateProperty = async function(id, payload){
        const { data, error } = await client.from('properties').update(payload).eq('id', id).select();
        if (error) return { success: false, error, data: null };
        return { success: true, error: null, data: data[0] };
      };
      document.addEventListener('DOMContentLoaded', () => {
        window.supabaseClient = client;
      });
      window.insertProperty = async function(payload){
        const { data, error } = await client.from('properties').insert([payload]).select();
        if (error) return { success: false, error, data: null };
        return { success: true, error: null, data: data[0] };
      };
      window.__applyMock = function(){
        window.supabaseClient = client;
        window.getPropertyById = async function(id){
          const { data, error } = await client.from('properties').eq('id', id).single();
          return { success: !error, data, error };
        };
        window.updateProperty = async function(id, payload){
          const { data, error } = await client.from('properties').update(payload).eq('id', id).select();
          if (error) return { success: false, error, data: null };
          return { success: true, error: null, data: data[0] };
        };
        window.insertProperty = async function(payload){
          const { data, error } = await client.from('properties').insert([payload]).select();
          if (error) return { success: false, error, data: null };
          return { success: true, error: null, data: data[0] };
        };
      };
      document.addEventListener('DOMContentLoaded', () => {
        window.__applyMock();
      });
      window.notifyStatusChange = () => Promise.resolve();
      window.notifyNewProperty = () => Promise.resolve();
    })();
  `;
}

async function run(){
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Mock Supabase and set admin session early
  await page.addInitScript(supabaseInitScript([{
    id: 'prop-1',
    property_number: '20250101001',
    register_date: '2025-01-01',
    manager: '하상현',
    status: '거래가능',
    property_type: '아파트',
    trade_type: '매매',
    price: '50000',
    property_name: '테스트매물',
    address: '서울시 강남구',
    dong: '101',
    ho: '1501',
    supply_area_sqm: '84.5',
    supply_area_pyeong: '25.5',
    floor_current: '15',
    floor_total: '20',
    rooms: '3/2',
    direction: '남향',
    management_fee: '20만원',
    parking: '1대',
    move_in_date: '2025-03-01',
    approval_date: '2022-05-15',
    special_notes: '초기',
    manager_memo: ''
  }]));
  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_logged_in', 'true');
  });

  page.on('console', msg => console.log('[browser]', msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  page.on('dialog', d => d.accept());

  const url = fileUrl('form.html') + '?id=prop-1';
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'load' });

  await page.waitForSelector('#propertyName', { timeout: 10000 });
  await page.evaluate(async () => {
    if (typeof window.__applyMock === 'function') window.__applyMock();
    if (typeof window.loadPropertyForEdit === 'function') await window.loadPropertyForEdit('prop-1');
  });
  const before = await page.inputValue('#propertyName');
  console.log('Loaded propertyName:', before);

  const env = await page.evaluate(async () => ({
    hasClient: !!window.supabaseClient,
    hasUpdateFn: typeof window.updateProperty === 'function',
    initial: (await window.getPropertyById('prop-1')).data?.property_name || null
  }));
  console.log('Env:', env);

  // Edit values
  await page.fill('#propertyName', '테스트매물_수정');
  await page.fill('#price', '55000');
  await page.fill('#specialNotes', '수정 완료');

  // Save via confirm modal
  await page.click('.btn-save');
  await page.click('#confirmBtn');
  // In file:// mode, the app builds an absolute path without scheme, so
  // redirect may not work. Wait briefly to allow save to complete and alerts to show.
  await page.waitForTimeout(1000);

  // Re-open to verify persisted values in mock db (skip relying on redirect)
  await page.goto(url);
  await page.waitForSelector('#propertyName');
  const afterDb = await page.evaluate(async () => (await window.getPropertyById('prop-1')).data);
  console.log('DB after save:', afterDb);
  const nameAfter = await page.inputValue('#propertyName');
  const priceAfter = await page.inputValue('#price');
  const notesAfter = await page.inputValue('#specialNotes');
  console.log('After update:', { nameAfter, priceAfter, notesAfter });

  if (nameAfter !== '테스트매물_수정' || priceAfter !== '55000' || notesAfter !== '수정 완료') {
    await page.screenshot({ path: 'update-check.png', fullPage: true });
    const html = await page.content();
    await fs.writeFile('update-check.html', html, 'utf8');
    throw new Error('Updated values not reflected in form');
  }

  await browser.close();
  console.log('✅ Update flow passed (mocked Supabase).');
}

run().catch(err => { console.error('❌ Update check failed:', err); process.exit(1); });
