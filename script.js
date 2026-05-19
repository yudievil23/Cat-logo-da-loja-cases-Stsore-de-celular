// Estado do Sistema
let phones = JSON.parse(localStorage.getItem('cs_phones')) || [];
let storeInfo = JSON.parse(localStorage.getItem('cs_store_info')) || { name: "CASES STORE", logo: "" };
let installmentRates = JSON.parse(localStorage.getItem('cs_rates')) || {
    1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12
};
let currentUploadedPhotos = [];
let customChecklistCount = 0;
let selectedInstallmentCardId = null;

// Inicialização do Sistema
document.addEventListener("DOMContentLoaded", () => {
    loadStoreInfo();
    updateDashboard();
    renderPhoneGrid(phones);
    setupModalClosers();
    renderRatesEditInputs();
});

// 7. Botão: "Editar Loja"
function loadStoreInfo() {
    const storeNameEl = document.getElementById("storeName");
    const logoPreviewEl = document.getElementById("logoPreview");
    if (storeNameEl) storeNameEl.textContent = storeInfo.name;
    if (logoPreviewEl) {
        if (storeInfo.logo) {
            logoPreviewEl.src = storeInfo.logo;
            logoPreviewEl.classList.remove("hidden");
        } else {
            logoPreviewEl.classList.add("hidden");
        }
    }
}

function editStoreInfo() {
    const newName = prompt("Digite o nome da loja:", storeInfo.name);
    if (newName === null) return;
    if (newName.trim() === "") {
        alert("O nome da loja não pode ser vazio.");
        return;
    }
    const newLogo = prompt("Digite a URL da imagem do logotipo (opcional):", storeInfo.logo);
    storeInfo.name = newName.trim();
    storeInfo.logo = newLogo ? newLogo.trim() : "";
    localStorage.setItem('cs_store_info', JSON.stringify(storeInfo));
    loadStoreInfo();
}

// Configuração de Fechamento de Modais Gerais (4. Botão: "X")
function setupModalClosers() {
    document.querySelectorAll(".modal").forEach(modal => {
        const closeBtn = modal.querySelector(".close-btn");
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = "none";
            };
        }
    });
    window.onclick = (event) => {
        if (event.target.classList.contains("modal")) {
            event.target.style.display = "none";
        }
    };
}

// 1. Botão: "Novo Aparelho"
function showAddModal() {
    document.getElementById("modalTitle").textContent = "Adicionar Novo Aparelho";
    document.getElementById("phoneId").value = "";
    document.getElementById("phoneForm").reset();
    currentUploadedPhotos = [];
    document.getElementById("photoThumbnails").innerHTML = "";
    
    // Reset Checklist Dinâmico
    const checklistContainer = document.getElementById("checklistItems");
    const staticItems = checklistContainer.querySelectorAll(".checklist-item:not(.custom-checklist-item)");
    checklistContainer.innerHTML = "";
    staticItems.forEach(item => {
        const inputs = item.querySelectorAll("input");
        inputs.forEach(i => {
            if (i.type === "checkbox") i.checked = false;
            if (i.type === "number") i.value = "";
        });
        checklistContainer.appendChild(item);
    });
    
    document.getElementById("phoneModal").style.display = "block";
}

// 3. Botão: "Cancelar"
function closePhoneModal() {
    document.getElementById("phoneModal").style.display = "none";
}

// 8. Botão: "Adicionar Fotos"
function triggerPhotoUpload() {
    document.getElementById("phonePhotos").click();
}

// 9. Upload de Fotos
function handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result;
            currentUploadedPhotos.push(base64Data);
            renderPhotoThumbnails();
        };
        reader.readAsDataURL(file);
    });
    event.target.value = "";
}

function renderPhotoThumbnails() {
    const container = document.getElementById("photoThumbnails");
    container.innerHTML = "";
    currentUploadedPhotos.forEach((src, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "relative inline-block";
        
        const img = document.createElement("img");
        img.src = src;
        img.className = "photo-thumbnail";
        
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "absolute top-0 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs";
        removeBtn.innerHTML = "&times;";
        removeBtn.onclick = () => {
            currentUploadedPhotos.splice(index, 1);
            renderPhotoThumbnails();
        };
        
        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
    });
}

// 10. Botão: "Adicionar Item" (Checklist)
function addCustomChecklistItem() {
    customChecklistCount++;
    const id = "customCheck_" + customChecklistCount;
    const labelText = prompt("Nome do novo item do checklist:");
    if (!labelText || labelText.trim() === "") return;
    
    const container = document.getElementById("checklistItems");
    const div = document.createElement("div");
    div.className = "checklist-item custom-checklist-item";
    div.innerHTML = `
        <input type="checkbox" id="${id}" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700">
        <label for="${id}" class="text-sm text-gray-300 ml-2 flex-grow" data-label="${labelText.replace(/"/g, '&quot;')}">${labelText}</label>
        <i class="fas fa-trash remove-checklist-item" onclick="this.parentElement.remove()"></i>
    `;
    container.appendChild(div);
}

// 2. Botão: "Salvar" (formulário)
function savePhone(event) {
    event.preventDefault();
    
    const phoneIdEl = document.getElementById("phoneId").value;
    const brand = document.getElementById("brand").value;
    const model = document.getElementById("model").value;
    const color = document.getElementById("color").value;
    const storage = document.getElementById("storage").value;
    const imei = document.getElementById("imei").value;
    const purchasePrice = parseFloat(document.getElementById("purchasePrice").value);
    const salePrice = parseFloat(document.getElementById("salePrice").value);
    const observation = document.getElementById("observation").value;
    
    if (!brand || !model || !color || !storage || isNaN(purchasePrice) || isNaN(salePrice)) {
        alert("Por favor preencha todos os campos obrigatórios.");
        return;
    }
    
    // Coletar Checklist
    const checklist = [];
    
    // Itens estáticos fixos
    const batteryOk = document.getElementById("batteryOk").checked;
    const batteryHealth = document.getElementById("batteryHealth").value;
    checklist.push({ id: "batteryOk", type: "static", label: "Bateria OK", checked: batteryOk, value: batteryHealth });
    
    const cameraOk = document.getElementById("cameraOk").checked;
    checklist.push({ id: "cameraOk", type: "static", label: "Câmeras OK", checked: cameraOk });
    
    const biometryOk = document.getElementById("biometryOk").checked;
    checklist.push({ id: "biometryOk", type: "static", label: "Biometria OK", checked: biometryOk });
    
    const deletedOk = document.getElementById("deletedOk").checked;
    checklist.push({ id: "deletedOk", type: "static", label: "Apagado OK", checked: deletedOk });
    
    // Itens customizados dinâmicos
    document.querySelectorAll(".custom-checklist-item").forEach(item => {
        const checkbox = item.querySelector("input[type='checkbox']");
        const label = item.querySelector("label");
        checklist.push({
            id: checkbox.id,
            type: "custom",
            label: label.textContent,
            checked: checkbox.checked
        });
    });
    
    if (phoneIdEl) {
        // 5. Modo edição
        const index = phones.findIndex(p => p.id === phoneIdEl);
        if (index !== -1) {
            phones[index] = {
                ...phones[index],
                brand, model, color, storage, imei, purchasePrice, salePrice, observation,
                checklist, photos: currentUploadedPhotos
            };
        }
    } else {
        // Novo cadastro
        const newPhone = {
            id: "phone_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            brand, model, color, storage, imei, purchasePrice, salePrice, observation,
            checklist, photos: currentUploadedPhotos,
            status: "available"
        };
        phones.push(newPhone);
    }
    
    localStorage.setItem('cs_phones', JSON.stringify(phones));
    updateDashboard();
    
    // Reseta filtros para garantir visualização direta imediata no catálogo
    if (document.getElementById("searchInput")) document.getElementById("searchInput").value = "";
    if (document.getElementById("brandFilter")) document.getElementById("brandFilter").value = "";
    if (document.getElementById("statusFilter")) document.getElementById("statusFilter").value = "";
    
    renderPhoneGrid(phones);
    closePhoneModal();
}

// 5. Botão: "Editar"
function editPhone(id) {
    const phone = phones.find(p => p.id === id);
    if (!phone) return;
    
    document.getElementById("modalTitle").textContent = "Editar Aparelho";
    document.getElementById("phoneId").value = phone.id;
    document.getElementById("brand").value = phone.brand;
    document.getElementById("model").value = phone.model;
    document.getElementById("color").value = phone.color;
    document.getElementById("storage").value = phone.storage;
    document.getElementById("imei").value = phone.imei || "";
    document.getElementById("purchasePrice").value = phone.purchasePrice;
    document.getElementById("salePrice").value = phone.salePrice;
    document.getElementById("observation").value = phone.observation || "";
    
    // Resetar e Remontar Checklist
    const checklistContainer = document.getElementById("checklistItems");
    checklistContainer.innerHTML = `
        <div class="checklist-item">
            <input type="checkbox" id="batteryOk" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700">
            <label for="batteryOk" class="text-sm text-gray-300">Bateria OK</label>
            <input type="number" id="batteryHealth" min="0" max="100" placeholder="%" class="px-2 py-1 border border-gray-600 rounded-md bg-gray-700 text-white">
        </div>
        <div class="checklist-item">
            <input type="checkbox" id="cameraOk" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700">
            <label for="cameraOk" class="text-sm text-gray-300">Câmeras OK</label>
        </div>
        <div class="checklist-item">
            <input type="checkbox" id="biometryOk" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700">
            <label for="biometryOk" class="text-sm text-gray-300">Biometria OK</label>
        </div>
        <div class="checklist-item">
            <input type="checkbox" id="deletedOk" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700">
            <label for="deletedOk" class="text-sm text-gray-300">Apagado OK</label>
        </div>
    `;
    
    phone.checklist.forEach(item => {
        if (item.type === "static") {
            const cb = document.getElementById(item.id);
            if (cb) cb.checked = item.checked;
            if (item.id === "batteryOk" && item.value !== undefined) {
                document.getElementById("batteryHealth").value = item.value;
            }
        } else if (item.type === "custom") {
            customChecklistCount++;
            const div = document.createElement("div");
            div.className = "checklist-item custom-checklist-item";
            div.innerHTML = `
                <input type="checkbox" id="${item.id}" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700" ${item.checked ? 'checked' : ''}>
                <label for="${item.id}" class="text-sm text-gray-300 ml-2 flex-grow">${item.label}</label>
                <i class="fas fa-trash remove-checklist-item" onclick="this.parentElement.remove()"></i>
            `;
            checklistContainer.appendChild(div);
        }
    });
    
    currentUploadedPhotos = [...(phone.photos || [])];
    renderPhotoThumbnails();
    
    document.getElementById("phoneModal").style.display = "block";
}

// 6. Botão: "Excluir"
function deletePhone(id) {
    if (confirm("Tem certeza que deseja excluir permanentemente este aparelho?")) {
        phones = phones.filter(p => p.id !== id);
        localStorage.setItem('cs_phones', JSON.stringify(phones));
        updateDashboard();
        filterPhones();
    }
}

// Alternar Status de Venda diretamente no Card
function toggleStatus(id) {
    const phone = phones.find(p => p.id === id);
    if (!phone) return;
    phone.status = phone.status === "available" ? "sold" : "available";
    localStorage.setItem('cs_phones', JSON.stringify(phones));
    updateDashboard();
    filterPhones();
}

// Atualizar Indicadores Globais do Painel
function updateDashboard() {
    const availablePhones = phones.filter(p => p.status === "available");
    const soldPhones = phones.filter(p => p.status === "sold");
    
    const totalStock = availablePhones.length;
    const totalSales = soldPhones.length;
    
    const stockValue = availablePhones.reduce((acc, curr) => acc + (curr.salePrice || 0), 0);
    const totalInvested = availablePhones.reduce((acc, curr) => acc + (curr.purchasePrice || 0), 0);
    
    document.getElementById("totalStock").textContent = totalStock;
    document.getElementById("totalSales").textContent = totalSales;
    document.getElementById("stockValue").textContent = stockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("totalInvested").textContent = totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 12. Filtros e Busca
function filterPhones() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const brand = document.getElementById("brandFilter").value;
    const status = document.getElementById("statusFilter").value;
    
    const filtered = phones.filter(p => {
        const matchesQuery = p.model.toLowerCase().includes(query) || (p.imei && p.imei.includes(query));
        const matchesBrand = brand === "" || p.brand === brand;
        const matchesStatus = status === "" || p.status === status;
        return matchesQuery && matchesBrand && matchesStatus;
    });
    
    renderPhoneGrid(filtered);
}

// Construção Dinâmica do Grid de Aparelhos (11. Carrossel integrado)
function renderPhoneGrid(data) {
    const grid = document.getElementById("phoneGrid");
    grid.innerHTML = "";
    
    if (data.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">Nenhum aparelho encontrado.</div>`;
        return;
    }
    
    data.forEach(phone => {
        const card = document.createElement("div");
        card.className = `phone-card rounded-lg overflow-hidden shadow-lg p-4 flex flex-col justify-between`;
        
        // Montagem do Carrossel de Imagens do Card
        let carouselHtml = "";
        if (phone.photos && phone.photos.length > 0) {
            carouselHtml = `
                <div class="carousel relative w-full h-48 bg-gray-800 rounded mb-4">
                    <div class="carousel-inner w-full h-full flex transition-transform duration-300" id="carousel_inner_${phone.id}">
                        ${phone.photos.map(src => `<div class="carousel-item min-w-full h-full flex items-center justify-center"><img src="${src}" class="max-h-full max-w-full object-contain"></div>`).join('')}
                    </div>
                    ${phone.photos.length > 1 ? `
                        <button class="carousel-control prev" onclick="moveCarousel('${phone.id}', -1)">&lt;</button>
                        <button class="carousel-control next" onclick="moveCarousel('${phone.id}', 1)">&gt;</button>
                    ` : ''}
                </div>
            `;
        } else {
            carouselHtml = `
                <div class="w-full h-48 bg-gray-800 flex flex-col items-center justify-center text-gray-600 rounded mb-4">
                    <i class="fas fa-mobile-alt text-4xl mb-2"></i>
                    <span class="text-xs">Sem fotos cadastradas</span>
                </div>
            `;
        }
        
        // Formatação do Checklist para Exibição no Card
        let checklistHtml = "";
        if (phone.checklist && phone.checklist.length > 0) {
            checklistHtml = `
                <div class="mt-2 pt-2 border-t border-gray-700/50">
                    <span class="text-xs font-bold text-gray-400 block mb-1">Checklist Técnico:</span>
                    <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                        ${phone.checklist.map(item => {
                            const icon = item.checked ? '<i class="fas fa-check-circle text-green-400 mr-1"></i>' : '<i class="fas fa-times-circle text-red-400 mr-1"></i>';
                            let label = item.label;
                            if (item.id === "batteryOk" && item.value) {
                                label += ` (${item.value}%)`;
                            }
                            return `<div class="flex items-center text-gray-300 truncate">${icon} <span>${label}</span></div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // Formatação da Observação para Exibição no Card
        let obsHtml = "";
        if (phone.observation && phone.observation.trim() !== "") {
            obsHtml = `
                <div class="mt-2 pt-2 border-t border-gray-700/50">
                    <span class="text-xs font-bold text-gray-400 block">Obs:</span>
                    <p class="text-xs text-gray-400 italic line-clamp-2">${phone.observation}</p>
                </div>
            `;
        }
        
        const badgeClass = phone.status === "available" ? "status-available" : "status-sold";
        const badgeText = phone.status === "available" ? "Disponível" : "Vendido";
        
        card.innerHTML = `
            <div>
                ${carouselHtml}
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-xs uppercase font-bold tracking-wider text-blue-400">${phone.brand}</span>
                        <h4 class="text-xl font-bold text-white">${phone.model}</h4>
                    </div>
                    <span class="status-badge ${badgeClass} cursor-pointer" onclick="toggleStatus('${phone.id}')">${badgeText}</span>
                </div>
                <div class="text-sm text-gray-400 space-y-1 mb-2">
                    <p><strong class="text-gray-300">Cor:</strong> ${phone.color} | <strong class="text-gray-300">Armazenamento:</strong> ${phone.storage}</p>
                    ${phone.imei ? `<p><strong class="text-gray-300">IMEI:</strong> ${phone.imei}</p>` : ''}
                    <p><strong class="text-gray-300">Preço Venda:</strong> <span class="text-green-400 font-semibold">${phone.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                </div>
                ${checklistHtml}
                ${obsHtml}
            </div>
            <div class="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700 mt-3">
                <button onclick="editPhone('${phone.id}')" class="edit-btn py-1.5 px-2 rounded text-xs flex items-center justify-center font-medium"><i class="fas fa-edit mr-1"></i> Editar</button>
                <button onclick="deletePhone('${phone.id}')" class="delete-btn py-1.5 px-2 rounded text-xs flex items-center justify-center font-medium"><i class="fas fa-trash mr-1"></i> Excluir</button>
                <button onclick="openInstallmentModal('${phone.id}')" class="installment-btn col-span-2 py-1.5 px-2 rounded text-xs flex items-center justify-center font-medium mt-1"><i class="fas fa-credit-card mr-1"></i> Parcelamento / PDF</button>
            </div>
        `;
        
        card.dataset.currentIndex = 0;
        grid.appendChild(card);
    });
}

// 11. Botões do Carrossel (Fotos no Card)
function moveCarousel(phoneId, direction) {
    const inner = document.getElementById(`carousel_inner_${phoneId}`);
    if (!inner) return;
    const card = inner.closest(".phone-card");
    const totalItems = inner.children.length;
    let currentIndex = parseInt(card.dataset.currentIndex) || 0;
    
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = totalItems - 1;
    if (currentIndex >= totalItems) currentIndex = 0;
    
    card.dataset.currentIndex = currentIndex;
    inner.style.transform = `translateX(-${currentIndex * 100}%)`;
}

// 13. Botão de Parcelamento e Geração de PDF Técnico
function openInstallmentModal(id) {
    selectedInstallmentCardId = id;
    const phone = phones.find(p => p.id === id);
    if (!phone) return;
    
    document.getElementById("clientName").value = "";
    document.getElementById("clientEmail").value = "";
    document.getElementById("installmentTotalValue").textContent = phone.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    calculateInstallmentOptions(phone.salePrice);
    document.getElementById("installmentModal").style.display = "block";
}

function closeInstallmentModal() {
    document.getElementById("installmentModal").style.display = "none";
}

function calculateInstallmentOptions(baseValue) {
    const container = document.getElementById("installmentOptions");
    container.innerHTML = "";
    
    Object.keys(installmentRates).sort((a,b) => a-b).forEach(months => {
        const rate = installmentRates[months];
        const totalWithInterest = baseValue * (1 + (rate / 100));
        const monthlyInstallment = totalWithInterest / months;
        
        const optionDiv = document.createElement("div");
        optionDiv.className = "installment-option text-sm";
        optionDiv.id = `opt_${months}`;
        optionDiv.onclick = () => selectInstallmentOption(months);
        optionDiv.innerHTML = `
            <span class="text-gray-300 font-medium">${months}x de ${monthlyInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span class="text-gray-400 text-xs">Total: ${totalWithInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${rate}% juros)</span>
        `;
        container.appendChild(optionDiv);
    });
}

function selectInstallmentOption(months) {
    document.querySelectorAll(".installment-option").forEach(el => el.classList.remove("selected-installment"));
    const selectedEl = document.getElementById(`opt_${months}`);
    if (selectedEl) {
        selectedEl.classList.add("selected-installment");
        selectedEl.dataset.selectedMonths = months;
    }
}

// Gerenciar e Customizar Taxas de Juros das Parcelas
function showEditRatesModal() {
    document.getElementById("editRatesModal").style.display = "block";
}

function closeEditRatesModal() {
    document.getElementById("editRatesModal").style.display = "none";
}

// Renderizar inputs de edição de taxas
function renderRatesEditInputs() {
    const container = document.getElementById("ratesEditContainer");
    if (!container) return;
    container.innerHTML = "";
    
    Object.keys(installmentRates).sort((a,b) => a-b).forEach(months => {
        const div = document.createElement("div");
        div.className = "flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-600";
        div.innerHTML = `
            <span class="text-sm text-gray-300 font-medium">${months}x</span>
            <div class="flex items-center">
                <input type="number" step="0.01" value="${installmentRates[months]}" id="rate_input_${months}" class="rate-edit-input w-16 text-center rounded bg-gray-700 text-white text-sm px-1 py-0.5">
                <span class="text-sm text-gray-400 ml-1">%</span>
                <span class="rate-edit-btn text-xs ml-2 font-bold cursor-pointer text-blue-400" onclick="saveIndividualRate(${months})">Salvar</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function saveIndividualRate(months) {
    const input = document.getElementById(`rate_input_${months}`);
    if (!input) return;
    const newVal = parseFloat(input.value);
    if (isNaN(newVal) || newVal < 0) {
        alert("Insira uma taxa válida.");
        return;
    }
    installmentRates[months] = newVal;
    localStorage.setItem('cs_rates', JSON.stringify(installmentRates));
    
    if (selectedInstallmentCardId) {
        const phone = phones.find(p => p.id === selectedInstallmentCardId);
        if (phone) calculateInstallmentOptions(phone.salePrice);
    }
    alert(`Taxa para ${months}x updated com sucesso!`);
}

// Geração Estruturada do Relatório Técnico Comercial em PDF
function generatePdf() {
    const clientName = document.getElementById("clientName").value;
    if (!clientName || clientName.trim() === "") {
        alert("Por favor preencha o nome do cliente antes de gerar o PDF.");
        return;
    }
    const clientEmail = document.getElementById("clientEmail").value || "Não informado";
    const phone = phones.find(p => p.id === selectedInstallmentCardId);
    if (!phone) return;
    
    const selectedOpt = document.querySelector(".installment-option.selected-installment");
    let parcelInfo = "À vista";
    let finalPrice = phone.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    if (selectedOpt) {
        const months = selectedOpt.dataset.selectedMonths;
        const rate = installmentRates[months];
        const calcTotal = phone.salePrice * (1 + (rate / 100));
        const calcMonthly = calcTotal / months;
        parcelInfo = `${months}x de ${calcMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        finalPrice = calcTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    // Cabeçalho e Identidade Visual
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text(storeInfo.name, 15, 18);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Relatório Técnico e Comercial do Equipamento", 15, 26);
    
    const currentDate = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${currentDate}`, 170, 18);
    
    // Dados do Cliente
    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("1. Informações do Cliente", 15, 48);
    doc.line(15, 50, 195, 50);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Nome: ${clientName}`, 15, 57);
    doc.text(`E-mail: ${clientEmail}`, 15, 63);
    
    // Especificações do Aparelho
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("2. Especificações do Dispositivo", 15, 76);
    doc.line(15, 78, 195, 78);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Marca: ${phone.brand}`, 15, 85);
    doc.text(`Modelo: ${phone.model}`, 15, 91);
    doc.text(`Cor: ${phone.color}`, 110, 85);
    doc.text(`Armazenamento: ${phone.storage}`, 110, 91);
    doc.text(`IMEI: ${phone.imei || "Não Informado"}`, 15, 97);
    
    // Checklist de Inspeção Técnica
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("3. Checklist de Inspeção Técnica", 15, 110);
    doc.line(15, 112, 195, 112);
    
    let checkY = 120;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    
    phone.checklist.forEach(item => {
        if (checkY > 260) { doc.addPage(); checkY = 20; }
        const statusText = item.checked ? "[ OK ]" : "[ FALHA / NÃO VERIFICADO ]";
        let labelFinal = item.label;
        if (item.id === "batteryOk" && item.value) {
            labelFinal += ` (Saúde: ${item.value}%)`;
        }
        doc.text(`${statusText}  -  ${labelFinal}`, 20, checkY);
        checkY += 7;
    });
    
    // Condições Comerciais e Observações
    let commY = checkY + 5;
    if (commY > 240) { doc.addPage(); commY = 20; }
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("4. Condições de Venda e Pagamento", 15, commY);
    doc.line(15, commY + 2, 195, commY + 2);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Forma de Pagamento Selecionada: ${parcelInfo}`, 15, commY + 10);
    doc.setFont("Helvetica", "bold");
    doc.text(`Valor Final Total: ${finalPrice}`, 15, commY + 16);
    
    if (phone.observation && phone.observation.trim() !== "") {
        doc.setFont("Helvetica", "normal");
        doc.text("Observações Adicionais:", 15, commY + 24);
        doc.setFontSize(10);
        doc.text(phone.observation, 15, commY + 30, { maxWidth: 180 });
    }
    
    // Assinaturas de Conformidade
    let sigY = commY + 65;
    if (sigY > 270) { doc.addPage(); sigY = 50; }
    doc.line(15, sigY, 90, sigY);
    doc.line(120, sigY, 195, sigY);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text("Assinatura do Técnico Responsável", 23, sigY + 5);
    doc.text("Assinatura de Conformidade do Cliente", 125, sigY + 5);
    
    doc.save(`Relatorio_${phone.model.replace(/\s+/g, '_')}_${clientName.replace(/\s+/g, '_')}.pdf`);
    closeInstallmentModal();
}