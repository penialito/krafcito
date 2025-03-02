// Check authentication and update UI accordingly
async function checkAuth() {
    try {
        const client = await window.initializeSupabase();
        const { data, error } = await client.auth.getSession();
        if (error || !data.session) {
            window.location.href = 'login.html';
            return false;
        }
        const { user } = data.session;
        let userRole = 'assistant';
        const { data: profileData, error: profileError } = await client
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
        if (!profileError && profileData?.role) {
            userRole = profileData.role;
        } else if (profileError) {
            console.error('Error getting user role:', profileError);
        }
        if (userRole === 'admin') {
            document.getElementById('usuarios-nav-item').style.display = 'block';
        }
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        if (userRoleDisplay) {
            userRoleDisplay.textContent = `${userRole.toUpperCase()}: ${user.email}`;
        }
        return true;
    } catch (err) {
        console.error('Auth error:', err);
        window.location.href = 'login.html?error=' + encodeURIComponent(err.message || 'Error de autenticación');
        return false;
    }
}

// Load equipos data and update counters & cards
async function loadEquipos() {
    try {
        const client = await window.initializeSupabase();
        const { data: equipos, error } = await client
            .from('equipos')
            .select('id, nombre_interno, marca_genset, modelo_genset, serie_genset, horometro, potencia_kw, cliente_id, clientes(nombre, rut)')
            .order('id', { ascending: true });
        if (error) throw error;

        // Update counters
        document.getElementById('total-equipos').textContent = equipos.length;
        const { operativos, alertas, criticos } = equipos.reduce(
            (acc, equipo) => {
                if (equipo.horometro < 400) acc.operativos++;
                else if (equipo.horometro < 600) acc.alertas++;
                else acc.criticos++;
                return acc;
            },
            { operativos: 0, alertas: 0, criticos: 0 }
        );
        document.getElementById('equipos-operativos').textContent = operativos;
        document.getElementById('equipos-alerta').textContent = alertas;
        document.getElementById('equipos-criticos').textContent = criticos;

        displayEquipos(equipos);
    } catch (err) {
        console.error('Error loading equipment:', err);
        showToast('Error', `No se pudieron cargar los equipos: ${err.message}`, 'error');
    }
}

// Render equipos as cards in the container
function displayEquipos(equipos) {
    const container = document.getElementById('generadores-container');
    if (!equipos.length) {
        container.innerHTML = '<div class="alert alert-info">No hay equipos registrados.</div>';
        return;
    }
    container.innerHTML = `
        <div class="row">
            ${equipos
                .map(equipo => {
                    let statusClass = 'bg-success';
                    let statusText = 'Operativo';
                    if (equipo.horometro > 600) {
                        statusClass = 'bg-danger';
                        statusText = 'Crítico';
                    } else if (equipo.horometro > 400) {
                        statusClass = 'bg-warning';
                        statusText = 'Alerta';
                    }
                    return `
                        <div class="col-md-4 mb-4">
                            <div class="card equipment-card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">${equipo.nombre_interno || equipo.serie_genset}</h5>
                                    <span class="badge ${statusClass}">${statusText}</span>
                                </div>
                                <div class="card-body">
                                    <p><strong>Cliente:</strong> ${equipo.clientes.nombre}</p>
                                    <p><strong>Marca:</strong> ${equipo.marca_genset || 'N/A'}</p>
                                    <p><strong>Modelo:</strong> ${equipo.modelo_genset || 'N/A'}</p>
                                    <p><strong>Horómetro:</strong> ${equipo.horometro || 0} hrs</p>
                                    <p><strong>Potencia:</strong> ${equipo.potencia_kw || 0} kW</p>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-primary btn-sm" onclick="verDetalleEquipo(${equipo.id})">
                                        <i class="fas fa-eye me-1"></i> Ver Detalles
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                })
                .join('')}
        </div>
    `;
}

// Initialize the dashboard application
document.addEventListener('DOMContentLoaded', async () => {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'flex';
    try {
        if (!(await checkAuth())) return;
        await Promise.all([loadEquipos(), loadMantenimientos(), loadEstadisticas()]);
        setupEventListeners();
    } catch (err) {
        console.error('Initialization error:', err);
        document.getElementById('error-container').classList.remove('d-none');
        document.getElementById('error-message').textContent = err.message || 'Error inicializando la aplicación';
    } finally {
        loadingIndicator.style.display = 'none';
    }
});

// Set up event listeners for UI interactions
function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const client = await window.initializeSupabase();
            await client.auth.signOut();
            window.location.href = 'login.html';
        } catch (err) {
            console.error('Logout error:', err);
            showToast('Error', 'No se pudo cerrar sesión', 'error');
        }
    });
    document.getElementById('equipos-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('equipos-search').value.toLowerCase();
        searchEquipos(searchTerm);
    });
}

// Helper function to display notifications using Bootstrap Toast
function showToast(title, message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastTime = document.getElementById('toastTime');

    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastTime.textContent = new Date().toLocaleTimeString();

    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    switch (type) {
        case 'success':
            toastEl.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastEl.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastEl.classList.add('bg-warning');
            break;
        default:
            toastEl.classList.add('bg-info', 'text-white');
    }

    new bootstrap.Toast(toastEl).show();
}
