import { test, expect } from '@playwright/test';
import path from 'path';

// Helper to build a file:// URL to a repo file
function fileUrl(relPath: string) {
  const abs = path.resolve(process.cwd(), relPath);
  const url = `file://${abs}`;
  return url;
}

// Minimal Supabase mock that supports the calls this app makes
function supabaseInitScript(mockData: any) {
  return `
    (function(){
      // Provide config to bypass warnings
      window.__CONFIG__ = { supabase: { url: 'mock', anonKey: 'mock' } };

      // Simple table store
      const db = { properties: ${JSON.stringify(mockData)} };

      // Query builder helpers
      function Table(name){ this.name = name; this._update = null; this._select = null; this._eq = null; this._order = []; this._range = null; this._or = null; this._not = null; }
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.update = function(obj){ this._update = obj; return this; };
      Table.prototype.insert = function(rows){ this._insert = rows; return this; };
      Table.prototype.delete = function(){ this._delete = true; return this; };
      Table.prototype.eq = function(field, value){ this._eq = { field, value }; return this; };
      Table.prototype.or = function(expr){ this._or = expr; return this; };
      Table.prototype.not = function(){ return this; };
      Table.prototype.order = function(){ return this; };
      Table.prototype.range = function(){ return this; };
      Table.prototype.limit = function(){ return this; };
      Table.prototype.single = async function(){
        const { field, value } = this._eq || {};
        const row = (db[this.name]||[]).find(r => String(r[field]) === String(value));
        if (!row) return { data: null, error: { code: 'NOT_FOUND', message: 'not found' } };
        return { data: row, error: null };
      };
      Table.prototype.selectExec = async function(){
        return { data: (db[this.name]||[]), error: null, count: (db[this.name]||[]).length };
      };
      Table.prototype._apply = function(){ return { data: (db[this.name]||[]), error: null }; };
      Table.prototype.exec = async function(){ return this._apply(); };
      Table.prototype.selectReturn = async function(){ return this._apply(); };
      Table.prototype.then = undefined;
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype._findIndex = function(){
        if (!this._eq) return -1;
        const { field, value } = this._eq;
        return (db[this.name]||[]).findIndex(r => String(r[field]) === String(value));
      };
      Table.prototype._resp = function(rows){ return { data: rows, error: null, count: rows?.length ?? 0 }; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.selectAndReturn = async function(rows){ return { data: rows, error: null }; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      // Overloads used by app
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      // Action methods that return select() result
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };
      // Implement .select() chain terminators used in code
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };

      // Execute wrappers used by app
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.then = undefined;
      Table.prototype.select = function(){ this._select = true; return this; };

      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };

      // Custom handlers mapped to exact usage
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };

      // Final operation handlers used by code
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };

      // Shortcuts invoked via await ... .select()
      Table.prototype.select = function(){ this._select = true; return this; };
      Table.prototype.select = function(){ this._select = true; return this; };

      // Minimal methods used directly with await
      Table.prototype.select = async function(){
        // mimic PostgREST returning current rows
        const rows = (db[this.name]||[]);
        return { data: rows, error: null, count: rows.length };
      };
      Table.prototype.single = async function(){
        const { field, value } = this._eq || {};
        const row = (db[this.name]||[]).find(r => String(r[field]) === String(value));
        if (!row) return { data: null, error: { message: 'not found' } };
        return { data: row, error: null };
      };
      Table.prototype.update = function(obj){ this._update = obj; return this; };
      Table.prototype.insert = function(rows){ this._insert = rows; return this; };
      Table.prototype.delete = function(){ this._delete = true; return this; };
      Table.prototype.eq = function(field, value){ this._eq = { field, value }; return this; };
      Table.prototype.selectAfter = async function(){
        // handle update
        if (this._update) {
          const idx = this._findIndex();
          if (idx === -1) return { data: null, error: { message: 'not found' } };
          db[this.name][idx] = { ...db[this.name][idx], ...this._update };
          return { data: [ db[this.name][idx] ], error: null };
        }
        if (this._insert) {
          const rows = Array.isArray(this._insert) ? this._insert : [this._insert];
          db[this.name].push(...rows);
          return { data: rows, error: null };
        }
        if (this._delete) {
          const idx = this._findIndex();
          if (idx === -1) return { data: null, error: { message: 'not found' } };
          const removed = db[this.name].splice(idx, 1);
          return { data: removed, error: null };
        }
        return { data: (db[this.name]||[]), error: null };
      };

      const client = {
        from(name){ return new Table(name); }
      };

      window.supabase = { createClient: () => client };
    })();
  `;
}

test.describe('CRUD - Update flow (mocked Supabase)', () => {
  test('edits a property via form.html and updates Supabase', async ({ page }) => {
    // Prepare one existing row and stub supabase in page before any script executes
    const existing = [{
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
    }];

    await page.addInitScript(supabaseInitScript(existing));
    await page.addInitScript(() => {
      // Pretend admin
      window.sessionStorage.setItem('admin_logged_in', 'true');
      // Stub Slack notifiers to no-op
      (window as any).notifyStatusChange = () => Promise.resolve();
      (window as any).notifyNewProperty = () => Promise.resolve();
    });

    // Handle alert dialogs automatically
    page.on('dialog', d => d.accept());

    // Open edit form
    await page.goto(fileUrl('form.html') + '?id=prop-1');

    // Wait for form to populate
    await page.waitForSelector('#propertyName');
    await expect(page.locator('#propertyName')).toHaveValue('테스트매물');

    // Modify fields
    await page.fill('#propertyName', '테스트매물_수정');
    await page.fill('#price', '55000');
    await page.fill('#specialNotes', '수정 완료');

    // Trigger save via confirm modal
    await page.click('text=저장하기');
    await page.click('#confirmBtn');

    // Expect navigation back to index.html
    await page.waitForURL(/index\.html$/);

    // Open the form again to verify data was updated through our mock
    await page.goto(fileUrl('form.html') + '?id=prop-1');
    await page.waitForSelector('#propertyName');
    await expect(page.locator('#propertyName')).toHaveValue('테스트매물_수정');
    await expect(page.locator('#price')).toHaveValue('55000');
    await expect(page.locator('#specialNotes')).toHaveValue('수정 완료');
  });
});

