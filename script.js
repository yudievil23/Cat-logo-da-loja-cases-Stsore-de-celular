// ================================================================
// script.js - Cases Store com Supabase Realtime
// ================================================================

let phones = [];
let storeInfo = { name: "CASES STORE", logo: "" };
let installmentRates = { 1:0,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,11:11,12:12 };
let currentUploadedPhotos = [];
let customChecklistCount = 0;
let selectedInstallmentCardId = null;
let realtimeChannel = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadStoreInfoFromDB();
  await loadRatesFromDB();
  await loadPhonesFromDB();
  setupModalClosers();
  renderRatesEditInputs();
  setupRealtime();
});

async function loadStoreInfoFromDB() {
  try {
    const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) { storeInfo = { name: data.name, logo: data.logo_url || "" }; }
    renderStoreInfo();
  } catch (e) { console.warn('Erro store_settings:', e.message); renderStoreInfo(); }
}

async function saveStoreInfoToDB(name, logo) {
  try {
    const { data: ex } = await supabase.from('store_settings').select('id').limit(1).single();
    if (ex) {
      await supabase.from('store_settings').update({ name, logo_url: logo, updated_at: new Date().toISOString() }).eq('id', ex.id);
    } else {
      await supabase.from('store_settings').insert([{ name, logo_url: logo }]);
    }
    storeInfo = { name, logo };
    renderStoreInfo();
  } catch (e) { alert('Erro ao salvar loja: ' + e.message); }
}

function renderStoreInfo() {
  const el = document.getElementById("storeName");
  const logoEl = document.getElementById("logoPreview");
  if (el) el.textContent = storeInfo.name;
  if (logoEl) {
    if (storeInfo.logo) { logoEl.src = storeInfo.logo; logoEl.classList.remove("hidden"); }
    else { logoEl.classList.add("hidden"); }
  }
}

function loadStoreInfo() { renderStoreInfo(); }

function editStoreInfo() {
  const newName = prompt("Nome da loja:", storeInfo.name);
  if (newName === null) return;
  if (!newName.trim()) { alert("Nome nao pode ser vazio."); return; }
  const newLogo = prompt("URL do logo (opcional):", storeInfo.logo);
  saveStoreInfoToDB(newName.trim(), newLogo ? newLogo.trim() : "");
}

async function loadRatesFromDB() {
  try {
    const { data, error } = await supabase.from('installment_rates').select('*').order('installment');
    if (error) throw error;
    if (data) data.forEach(r => { installmentRates[r.installment] = parseFloat(r.rate); });
  } catch (e) { console.warn('Erro rates:', e.message); }
}

async function saveRateToDB(installment, rate) {
  try {
    await supabase.from('installment_rates').upsert(
      { installment: parseInt(installment), rate: parseFloat(rate), updated_at: new Date().toISOString() },
      { onConflict: 'installment' }
    );
    installmentRates[installment] = rate;
  } catch (e) { console.warn('Erro salvar taxa:', e.message); }
}

async function loadPhonesFromDB() {
  try {
    const { data, error } = await supabase.from('phones').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    phones = (data || []).map(dbToLocal);
    updateDashboard();
    renderPhoneGrid(phones);
  } catch (e) {
    console.warn('Erro phones:', e.message);
    phones = []; updateDashboard(); renderPhoneGrid(phones);
  }
}

function dbToLocal(row) {
  return {
    id: row.id, brand: row.brand, model: row.model, color: row.color, storage: row.storage,
    imei: row.imei || '', purchasePrice: parseFloat(row.purchase_price) || 0,
    salePrice: parseFloat(row.sale_price) || 0, observation: row.observation || '',
    status: row.status || 'available',
    photos: Array.isArray(row.photos) ? row.photos : [],
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    createdAt: row.created_at
  };
}

async function addPhoneToDB(d) {
  try {
    const { data, error } = await supabase.from('phones').insert([{
      brand: d.brand, model: d.model, color: d.color, storage: d.storage,
      imei: d.imei, purchase_price: d.purchasePrice, sale_price: d.salePrice,
      observation: d.observation, status: d.status, photos: d.photos || [], checklist: d.checklist || []
    }]).select().single();
    if (error) throw error;
    return data;
  } catch (e) { alert('Erro adicionar: ' + e.message); return null; }
}

async function updatePhoneInDB(id, d) {
  try {
    const { error } = await supabase.from('phones').update({
      brand: d.brand, model: d.model, color: d.color, storage: d.storage,
      imei: d.imei, purchase_price: d.purchasePrice, sale_price: d.salePrice,
      observation: d.observation, status: d.status, photos: d.photos || [],
      checklist: d.checklist || [], updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
  } catch (e) { alert('Erro atualizar: ' + e.message); }
}

async function deletePhoneFromDB(id) {
  try {
    const { error } = await supabase.from('phones').delete().eq('id', id);
    if (error) throw error;
  } catch (e) { alert('Erro deletar: ' + e.message); }
}

async function toggleStatusInDB(id, newStatus) {
  try {
    const { error } = await supabase.from('phones').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  } catch (e) { alert('Erro status: ' + e.message); }
}

function setupRealtime() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase.channel('cases-store-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'phones' }, () => loadPhonesFromDB())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => loadStoreInfoFromDB())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'installment_rates' }, () => loadRatesFromDB())
    .subscribe();
}

function setupModalClosers() {
  document.querySelectorAll(".modal").forEach(modal => {
    const btn = modal.querySelector(".close-btn");
    if (btn) btn.onclick = () => { modal.style.display = "none"; };
  });
  window.onclick = e => { if (e.target.classList.contains("modal")) e.target.style.display = "none"; };
}

function showAddModal() {
  const modal = document.getElementById("addPhoneModal");
  if (!modal) return;
  document.getElementById("modalTitle").textContent = "Adicionar Aparelho";
  document.getElementById("addPhoneForm").reset();
  document.getElementById("phoneId").value = "";
  currentUploadedPhotos = []; customChecklistCount = 0;
  renderPhotoThumbnails();
  const cc = document.getElementById("customChecklistContainer");
  if (cc) cc.innerHTML = "";
  modal.style.display = "flex";
}

function closePhoneModal() {
  const modal = document.getElementById("addPhoneModal");
  if (modal) modal.style.display = "none";
}

function triggerPhotoUpload() { document.getElementById("photoInput").click(); }

function handlePhotoUpload(event) {
  Array.from(event.target.files).forEach(file => {
    const r = new FileReader();
    r.onload = e => { currentUploadedPhotos.push(e.target.result); renderPhotoThumbnails(); };
    r.readAsDataURL(file);
  });
}

function renderPhotoThumbnails() {
  const c = document.getElementById("photoThumbnails");
  if (!c) return;
  c.innerHTML = "";
  currentUploadedPhotos.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "relative";
    d.innerHTML = '<img src="' + p + '" class="w-20 h-20 object-cover rounded-lg"><button onclick="removePhoto(' + i + ')" class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs">x</button>';
    c.appendChild(d);
  });
}

function removePhoto(i) { currentUploadedPhotos.splice(i, 1); renderPhotoThumbnails(); }

function addCustomChecklistItem() {
  customChecklistCount++;
  const c = document.getElementById("customChecklistContainer");
  if (!c) return;
  const d = document.createElement("div");
  d.className = "flex items-center gap-2 mb-2";
  d.innerHTML = '<input type="checkbox" id="custom_' + customChecklistCount + '" class="w-4 h-4"><input type="text" placeholder="Item..." class="bg-gray-700 text-white px-2 py-1 rounded text-sm flex-1" id="custom_label_' + customChecklistCount + '">';
  c.appendChild(d);
}

async function savePhone() {
  const brand = document.getElementById("brand")?.value?.trim();
  const model = document.getElementById("model")?.value?.trim();
  const color = document.getElementById("color")?.value?.trim();
  const storage = document.getElementById("storage")?.value?.trim();
  if (!brand || !model || !color || !storage) { alert("Preencha Marca, Modelo, Cor e Armazenamento."); return; }
  const checklist = buildChecklist();
  const phoneData = {
    brand, model, color, storage,
    imei: document.getElementById("imei")?.value?.trim() || "",
    purchasePrice: parseFloat(document.getElementById("purchasePrice")?.value) || 0,
    salePrice: parseFloat(document.getElementById("salePrice")?.value) || 0,
    observation: document.getElementById("observation")?.value?.trim() || "",
    status: "available", photos: currentUploadedPhotos, checklist
  };
  const existingId = document.getElementById("phoneId")?.value;
  if (existingId) { await updatePhoneInDB(existingId, phoneData); }
  else { await addPhoneToDB(phoneData); }
  closePhoneModal();
  await loadPhonesFromDB();
}

function buildChecklist() {
  const items = [];
  document.querySelectorAll('#addPhoneForm input[type="checkbox"][id^="check_"]').forEach(cb => {
    items.push({ label: cb.nextElementSibling?.textContent || cb.id, checked: cb.checked });
  });
  for (let i = 1; i <= customChecklistCount; i++) {
    const cb = document.getElementById('custom_' + i);
    const lbl = document.getElementById('custom_label_' + i);
    if (cb && lbl) items.push({ label: lbl.value || 'Item ' + i, checked: cb.checked });
  }
  return items;
}

function editPhone(id) {
  const phone = phones.find(p => p.id === id);
  if (!phone) return;
  const modal = document.getElementById("addPhoneModal");
  if (!modal) return;
  document.getElementById("modalTitle").textContent = "Editar Aparelho";
  document.getElementById("phoneId").value = phone.id;
  document.getElementById("brand").value = phone.brand;
  document.getElementById("model").value = phone.model;
  document.getElementById("color").value = phone.color;
  document.getElementById("storage").value = phone.storage;
  document.getElementById("imei").value = phone.imei;
  document.getElementById("purchasePrice").value = phone.purchasePrice;
  document.getElementById("salePrice").value = phone.salePrice;
  document.getElementById("observation").value = phone.observation;
  currentUploadedPhotos = [...(phone.photos || [])];
  renderPhotoThumbnails();
  modal.style.display = "flex";
}

async function deletePhone(id) {
  if (!confirm("Excluir este aparelho?")) return;
  await deletePhoneFromDB(id);
  await loadPhonesFromDB();
}

async function toggleStatus(id) {
  const phone = phones.find(p => p.id === id);
  if (!phone) return;
  const newStatus = phone.status === "available" ? "sold" : "available";
  await toggleStatusInDB(id, newStatus);
  await loadPhonesFromDB();
}

function updateDashboard() {
  const available = phones.filter(p => p.status === "available");
  const sold = phones.filter(p => p.status === "sold");
  const totalValue = available.reduce((s, p) => s + (p.salePrice || 0), 0);
  const avgPrice = available.length > 0 ? totalValue / available.length : 0;
  const el = id => document.getElementById(id);
  if (el("totalStock")) el("totalStock").textContent = available.length;
  if (el("totalSales")) el("totalSales").textContent = sold.length;
  if (el("stockValue")) el("stockValue").textContent = "R$ " + totalValue.toFixed(2).replace('.', ',');
  if (el("avgPrice")) el("avgPrice").textContent = "R$ " + avgPrice.toFixed(2).replace('.', ',');
}

function filterPhones() {
  const q = document.getElementById("searchInput")?.value?.toLowerCase() || "";
  const st = document.getElementById("statusFilter")?.value || "all";
  renderPhoneGrid(phones.filter(p => {
    const txt = !q || [p.brand, p.model, p.color, p.imei].some(v => v.toLowerCase().includes(q));
    return txt && (st === "all" || p.status === st);
  }));
}

let carouselIndexes = {};

function renderPhoneGrid(list) {
  const grid = document.getElementById("phoneGrid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-16"><i class="fas fa-mobile-alt text-5xl mb-4 block"></i><p>Nenhum aparelho encontrado.</p></div>';
    return;
  }
  list.forEach(phone => {
    const card = document.createElement("div");
    card.className = "phone-card bg-gray-800 rounded-xl shadow-lg overflow-hidden";
    const badge = phone.status === "available"
      ? '<span class="bg-green-700 text-green-200 text-xs px-2 py-1 rounded-full">Disponivel</span>'
      : '<span class="bg-red-700 text-red-200 text-xs px-2 py-1 rounded-full">Vendido</span>';
    const photos = phone.photos && phone.photos.length > 0
      ? '<div class="relative overflow-hidden rounded-t-xl" style="height:192px"><div class="flex transition-transform duration-300" id="carousel_' + phone.id + '" style="height:100%">' +
        phone.photos.map(p => '<img src="' + p + '" class="w-full h-full object-cover flex-shrink-0" style="min-width:100%">').join('') + '</div>' +
        (phone.photos.length > 1 ? '<button onclick="moveCarousel('' + phone.id + '',-1)" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8">&#8249;</button><button onclick="moveCarousel('' + phone.id + '',1)" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8">&#8250;</button>' : '') + '</div>'
      : '<div class="h-48 bg-gray-700 flex items-center justify-center rounded-t-xl"><i class="fas fa-mobile-alt text-5xl text-gray-500"></i></div>';
    card.innerHTML = photos +
      '<div class="p-4">' +
      '<div class="flex justify-between items-start mb-2"><h3 class="text-white font-bold text-lg">' + phone.brand + ' ' + phone.model + '</h3>' + badge + '</div>' +
      '<p class="text-gray-400 text-sm mb-1"><i class="fas fa-palette mr-1"></i>' + phone.color + ' - ' + phone.storage + '</p>' +
      (phone.imei ? '<p class="text-gray-500 text-xs mb-2"><i class="fas fa-barcode mr-1"></i>IMEI: ' + phone.imei + '</p>' : '') +
      '<div class="flex justify-between items-center mb-3"><span class="text-green-400 font-bold text-lg">R$ ' + (phone.salePrice || 0).toFixed(2).replace('.', ',') + '</span><span class="text-gray-500 text-sm">Compra: R$ ' + (phone.purchasePrice || 0).toFixed(2).replace('.', ',') + '</span></div>' +
      '<div class="flex gap-2 flex-wrap">' +
      '<button onclick="editPhone('' + phone.id + '')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"><i class="fas fa-edit mr-1"></i>Editar</button>' +
      '<button onclick="toggleStatus('' + phone.id + '')" class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"><i class="fas fa-sync mr-1"></i>Status</button>' +
      '<button onclick="openInstallmentModal('' + phone.id + '')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"><i class="fas fa-calculator mr-1"></i>Parcelas</button>' +
      '<button onclick="deletePhone('' + phone.id + '')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"><i class="fas fa-trash"></i></button>' +
      '</div></div>';
    grid.appendChild(card);
  });
}

function moveCarousel(id, dir) {
  const phone = phones.find(p => p.id === id);
  if (!phone || !phone.photos || phone.photos.length < 2) return;
  if (!carouselIndexes[id]) carouselIndexes[id] = 0;
  carouselIndexes[id] = (carouselIndexes[id] + dir + phone.photos.length) % phone.photos.length;
  const inner = document.getElementById('carousel_' + id);
  if (inner) inner.style.transform = 'translateX(-' + (carouselIndexes[id] * 100) + '%)';
}

function openInstallmentModal(id) {
  selectedInstallmentCardId = id;
  const phone = phones.find(p => p.id === id);
  if (!phone) return;
  const modal = document.getElementById("installmentModal");
  if (!modal) return;
  const t = document.getElementById("installmentModalTitle");
  if (t) t.textContent = 'Parcelas - ' + phone.brand + ' ' + phone.model;
  calculateInstallmentOptions(phone.salePrice);
  modal.style.display = "flex";
}

function closeInstallmentModal() {
  const modal = document.getElementById("installmentModal");
  if (modal) modal.style.display = "none";
}

function calculateInstallmentOptions(price) {
  const c = document.getElementById("installmentOptions");
  if (!c) return;
  c.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const rate = installmentRates[i] || 0;
    const total = price * (1 + rate / 100);
    const monthly = total / i;
    const d = document.createElement("div");
    d.className = "installment-card cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-center";
    d.innerHTML = '<p class="text-white font-bold">' + i + 'x</p><p class="text-green-400 font-bold">R$ ' + monthly.toFixed(2).replace('.', ',') + '</p><p class="text-gray-400 text-xs">Total: R$ ' + total.toFixed(2).replace('.', ',') + '</p><p class="text-gray-500 text-xs">Taxa: ' + rate + '%</p>';
    d.onclick = (ev) => {
      document.querySelectorAll('.installment-card').forEach(x => x.classList.remove('border-2', 'border-green-500'));
      ev.currentTarget.classList.add('border-2', 'border-green-500');
      const r = document.getElementById("installmentResult");
      if (r) r.innerHTML = '<p class="text-green-400 font-bold text-lg">' + i + 'x de R$ ' + monthly.toFixed(2).replace('.', ',') + ' (Taxa ' + rate + '%)</p><p class="text-gray-400">Total: R$ ' + total.toFixed(2).replace('.', ',') + '</p>';
    };
    c.appendChild(d);
  }
}

function showEditRatesModal() {
  const m = document.getElementById("editRatesModal");
  if (m) m.style.display = "flex";
}

function closeEditRatesModal() {
  const m = document.getElementById("editRatesModal");
  if (m) m.style.display = "none";
}

function renderRatesEditInputs() {
  const c = document.getElementById("ratesContainer");
  if (!c) return;
  c.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const d = document.createElement("div");
    d.className = "flex items-center gap-2 mb-2";
    d.innerHTML = '<label class="text-white w-16">' + i + 'x:</label><input type="number" id="rate_' + i + '" value="' + (installmentRates[i] || 0) + '" min="0" max="100" step="0.1" class="bg-gray-700 text-white px-2 py-1 rounded w-24" onblur="saveIndividualRate(' + i + ')"><span class="text-gray-400">%</span>';
    c.appendChild(d);
  }
}

async function saveIndividualRate(installment) {
  const input = document.getElementById('rate_' + installment);
  if (!input) return;
  const rate = parseFloat(input.value) || 0;
  await saveRateToDB(installment, rate);
}

function generatePdf(id) {
  const phone = phones.find(p => p.id === id);
  if (!phone) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(phone.brand + ' ' + phone.model, 20, 20);
  doc.setFontSize(12);
  doc.text('Cor: ' + phone.color, 20, 35);
  doc.text('Armazenamento: ' + phone.storage, 20, 45);
  if (phone.imei) doc.text('IMEI: ' + phone.imei, 20, 55);
  doc.text('Preco de Venda: R$ ' + (phone.salePrice || 0).toFixed(2), 20, 65);
  doc.text('Status: ' + (phone.status === 'available' ? 'Disponivel' : 'Vendido'), 20, 75);
  if (phone.observation) doc.text('Obs: ' + phone.observation, 20, 85);
  doc.save(phone.brand + '_' + phone.model + '.pdf');
      }
