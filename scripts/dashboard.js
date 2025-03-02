async function checkAuth() {
    try {
        // Use the globally available initializeSupabase function
        supabaseClient = await window.initializeSupabase();
        
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        if (!data.session) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return false;
        }
        
        // Store current user for later use
        currentUser = data.session.user;
        
        // Get user role from the profiles table
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();
            
        if (profileError) {
            console.error('Error getting user role:', profileError);
            userRole = 'assistant'; // Default role
        } else {
            userRole = profileData?.role || 'assistant';
        }
        
        // Update UI based on role
        if (userRole === 'admin') {
            document.getElementById('usuarios-nav-item').style.display = 'block';
        }
        
        // Show user info in header
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        if (userRoleDisplay) {
            userRoleDisplay.textContent = `${userRole.toUpperCase()}: ${currentUser.email}`;
        }
        
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        // Handle error gracefully
        window.location.href = 'login.html?error=' + encodeURIComponent(error.message || 'Error de autenticación');
        return false;
    }
}

async function loadEquipos() {
    try {
        const { data: equipos, error } = await supabaseClient
            .from('equipos')
            .select(`
                id,
                nombre_interno,
                marca_genset,
                modelo_genset,
                serie_genset,
                horometro,
                potencia_kw,
                cliente_id,
                clientes(nombre, rut)
            `)
            .order('id', { ascending: true });
            
        if (error) throw error;
        
        // Update counters
        document.getElementById('total-equipos').textContent = equipos.length;
        
        // Simple logic for operational status (you can adjust this)
        let operativos = 0;
        let alertas = 0;
        let criticos = 0;
        
        equipos.forEach(equipo => {
            // This is just an example - adjust based on your business logic
            if (equipo.horometro < 400) {
                operativos++;
            } else if (equipo.horometro < 600) {
                alertas++;
            } else {
                criticos++;
            }
        });
        
        document.getElementById('equipos-operativos').textContent = operativos;
        document.getElementById('equipos-alerta').textContent = alertas;
        document.getElementById('equipos-criticos').textContent = criticos;
        
        // Display equipment cards
        displayEquipos(equipos);
        
    } catch (error) {
        console.error('Error loading equipment:', error);
        showToast('Error', 'No se pudieron cargar los equipos: ' + error.message, 'error');
    }
}

function displayEquipos(equipos) {
    const container = document.getElementById('generadores-container');
    
    if (equipos.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No hay equipos registrados.</div>';
        return;
    }
    
    let html = '<div class="row">';
    
    equipos.forEach(equipo => {
        // Determine status class
        let statusClass = 'bg-success';
        let statusText = 'Operativo';
        
        if (equipo.horometro > 600) {
            statusClass = 'bg-danger';
            statusText = 'Crítico';
        } else if (equipo.horometro > 400) {
            statusClass = 'bg-warning';
            statusText = 'Alerta';
        }
        
        html += `
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
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Show loading indicator
        document.getElementById('loadingIndicator').style.display = 'flex';
        
        // Check authentication
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;
        
        // Load data
        await Promise.all([
            loadEquipos(),
            loadMantenimientos(),
            loadEstadisticas()
        ]);
        
        // Set up event listeners
        setupEventListeners();
        
        // Hide loading indicator
        document.getElementById('loadingIndicator').style.display = 'none';
        
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('error-container').classList.remove('d-none');
        document.getElementById('error-message').textContent = error.message || 'Error inicializando la aplicación';
    }
});

// Set up event listeners for UI interactions
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error', 'No se pudo cerrar sesión', 'error');
        }
    });
    
    // Equipment search
    document.getElementById('equipos-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('equipos-search').value.toLowerCase();
        searchEquipos(searchTerm);
    });
    
    // Add more event listeners as needed...
}

// Helper function to display notifications
function showToast(title, message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastTime = document.getElementById('toastTime');
    
    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastTime.textContent = new Date().toLocaleTimeString();
    
    // Set type-specific styling
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
    
    // Show the toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

