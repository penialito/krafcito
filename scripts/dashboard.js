// Fix for dashboard.js - Comprehensive solution

// 1. Fix loading functionalities and equipment data handling
async function loadEquipos(searchTerm = '', sortBy = currentSort) {
    try {
        // Show loading state
        document.getElementById('equipos-container').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Cargando equipos...</p>
            </div>
        `;
        
        currentSort = sortBy;
        
        // Build query with proper error handling
        let query = supabaseClient
            .from('equipos')
            .select('*, clientes(id, nombre)');
            
        // Add search filter if provided
        if (searchTerm) {
            query = query.or(`marca_genset.ilike.%${searchTerm}%,serie_genset.ilike.%${searchTerm}%,modelo_genset.ilike.%${searchTerm}%`);
        }
        
        // Add sorting
        if (sortBy === 'horometro-desc') {
            query = query.order('horometro', { ascending: false });
        } else if (sortBy === 'horometro-asc') {
            query = query.order('horometro', { ascending: true });
        } else if (sortBy === 'marca-asc') {
            query = query.order('marca_genset', { ascending: true });
        } else if (sortBy === 'marca-desc') {
            query = query.order('marca_genset', { ascending: false });
        }
        
        const { data, error } = await query;
        
        if (error) {
            throw error;
        }
        
        // Store data globally for access in other functions
        equiposData = data || [];
        
        // Clear and rebuild the container
        const container = document.getElementById('equipos-container');
        container.innerHTML = '';
        
        if (equiposData.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    No se encontraron equipos${searchTerm ? ' que coincidan con la búsqueda' : ''}.
                </div>
            `;
            return;
        }
        
        // Create cards for each equipment
        equiposData.forEach(equipo => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';
            card.innerHTML = `
                <div class="card equipment-card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${equipo.marca_genset}</h5>
                        <span class="badge ${getStatusBadgeClass(equipo.horas_equipo)}">
                            ${getStatusText(equipo.horas_equipo)}
                        </span>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small mb-1">Modelo: ${equipo.modelo_genset || 'N/A'}</p>
                        <p class="text-muted small mb-1">Serie: ${equipo.serie_genset}</p>
                        <p class="text-muted small mb-1">Cliente: ${equipo.clientes?.nombre || 'Sin cliente'}</p>
                        <div class="mt-3 d-flex justify-content-between">
                            <span class="fw-bold">Horómetro:</span>
                            <span>${equipo.horometro} hrs</span>
                        </div>
                        <div class="mt-2">
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar ${getProgressBarClass(equipo.horas_equipo)}" 
                                    role="progressbar" 
                                    style="width: ${getProgressPercent(equipo.horas_equipo)}%" 
                                    aria-valuenow="${equipo.horas_equipo}" 
                                    aria-valuemin="0" 
                                    aria-valuemax="250">
                                </div>
                            </div>
                            <div class="d-flex justify-content-between mt-1">
                                <small class="text-muted">Próximo servicio</small>
                                <small class="text-muted">${250 - equipo.horas_equipo} hrs restantes</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer text-center">
                        <button class="btn btn-primary ver-detalles-btn" data-id="${equipo.id}">
                            <i class="fas fa-eye"></i> Ver Detalles
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
            
            // Add event listener to the detail button
            card.querySelector('.ver-detalles-btn').addEventListener('click', function() {
                const equipoId = this.getAttribute('data-id');
                showEquipoDetails(equipoId);
            });
        });
        
    } catch (error) {
        console.error('Error loading equipment:', error);
        document.getElementById('equipos-container').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los equipos. Por favor, intente nuevamente.
                <br><small>${error.message || 'Error desconocido'}</small>
            </div>
        `;
    }
}

// 2. Fix status badge helper functions
function getStatusBadgeClass(horas) {
    if (horas === null || horas === undefined) return 'bg-secondary';
    
    if (horas < 100) {
        return 'bg-success';
    } else if (horas < 200) {
        return 'bg-warning';
    } else {
        return 'bg-danger';
    }
}

function getStatusText(horas) {
    if (horas === null || horas === undefined) return 'Sin datos';
    
    if (horas < 100) {
        return 'Normal';
    } else if (horas < 200) {
        return 'Próximo servicio';
    } else {
        return 'Servicio urgente';
    }
}

function getProgressBarClass(horas) {
    if (horas === null || horas === undefined) return 'bg-secondary';
    
    if (horas < 100) {
        return 'bg-success';
    } else if (horas < 200) {
        return 'bg-warning';
    } else {
        return 'bg-danger';
    }
}

function getProgressPercent(horas) {
    if (horas === null || horas === undefined) return 0;
    
    // Calculate percentage based on 250 hours maintenance cycle
    const percent = (horas / 250) * 100;
    return Math.min(percent, 100); // Cap at 100%
}

// 3. Fix authentication check with proper error handling
async function checkAuth() {
    try {
        supabaseClient = await initializeSupabase();
        
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
        
        // Get user role
        const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();
            
        if (userError) {
            console.error('Error getting user role:', userError);
            userRole = 'user'; // Default role
        } else {
            userRole = userData?.role || 'user';
        }
        
        // Update UI based on role
        if (userRole === 'admin' || userRole === 'tecnico') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.classList.remove('d-none');
            });
        }
        
        // Show user info in header
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.textContent = currentUser.email;
        }
        
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        // Handle error gracefully
        window.location.href = 'login.html?error=' + encodeURIComponent(error.message || 'Error de autenticación');
        return false;
    }
}

// 4. Fix equipment details modal
async function showEquipoDetails(equipoId) {
    const modalBody = document.getElementById('equipoDetalleBody');
    const modal = new bootstrap.Modal(document.getElementById('equipoDetalleModal'));
    
    // Show loading in modal body
    modalBody.innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Cargando detalles del equipo...</p>
        </div>
    `;
    
    // Show modal immediately with loading state
    modal.show();
    
    try {
        const { data: equipo, error } = await supabaseClient
            .from('equipos')
            .select('*, clientes(id, nombre)')
            .eq('id', equipoId)
            .single();
            
        if (error) {
            throw error;
        }
        
        // Fetch maintenance history
        const { data: mantenimientos, error: mantError } = await supabaseClient
            .from('mantenimientos')
            .select('*')
            .eq('equipo_id', equipoId)
            .order('fecha', { ascending: false });
            
        if (mantError) {
            console.error('Error fetching maintenance history:', mantError);
        }
        
        // Update modal content with equipment details
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h5>Información del Equipo</h5>
                    <table class="table table-sm">
                        <tr>
                            <th>Marca:</th>
                            <td>${equipo.marca_genset}</td>
                        </tr>
                        <tr>
                            <th>Modelo:</th>
                            <td>${equipo.modelo_genset || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Serie:</th>
                            <td>${equipo.serie_genset}</td>
                        </tr>
                        <tr>
                            <th>Potencia:</th>
                            <td>${equipo.potencia || 'N/A'} kW</td>
                        </tr>
                        <tr>
                            <th>Horómetro:</th>
                            <td>${equipo.horometro} hrs</td>
                        </tr>
                        <tr>
                            <th>Estado:</th>
                            <td>
                                <span class="badge ${getStatusBadgeClass(equipo.horas_equipo)}">
                                    ${getStatusText(equipo.horas_equipo)}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <th>Cliente:</th>
                            <td>${equipo.clientes?.nombre || 'Sin cliente'}</td>
                        </tr>
                        <tr>
                            <th>Último servicio:</th>
                            <td>${equipo.fecha_ultimo_servicio ? new Date(equipo.fecha_ultimo_servicio).toLocaleDateString() : 'Sin registros'}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h5>Historial de Mantenimientos</h5>
                    ${mantenimientos && mantenimientos.length > 0 ? `
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Horómetro</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${mantenimientos.map(m => `
                                    <tr>
                                        <td>${new Date(m.fecha).toLocaleDateString()}</td>
                                        <td>${m.tipo_mantenimiento}</td>
                                        <td>${m.horometro_al_realizar} hrs</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<div class="alert alert-info">No hay registros de mantenimiento</div>'}
                </div>
            </div>
            
            ${userRole === 'admin' || userRole === 'tecnico' ? `
                <div class="mt-3">
                    <h5>Acciones</h5>
                    <button class="btn btn-success registrar-mantenimiento-btn" data-id="${equipo.id}">
                        <i class="fas fa-tools"></i> Registrar Mantenimiento
                    </button>
                    <button class="btn btn-primary actualizar-horometro-btn" data-id="${equipo.id}" data-horometro="${equipo.horometro}">
                        <i class="fas fa-clock"></i> Actualizar Horómetro
                    </button>
                    <button class="btn btn-warning editar-equipo-btn" data-id="${equipo.id}">
                        <i class="fas fa-edit"></i> Editar Equipo
                    </button>
                </div>
            ` : ''}
        `;
        
        // Add event listeners to action buttons
        if (userRole === 'admin' || userRole === 'tecnico') {
            const regButton = document.querySelector('.registrar-mantenimiento-btn');
            if (regButton) {
                regButton.addEventListener('click', () => {
                    modal.hide();
                    showRegistrarMantenimientoModal(equipo);
                });
            }
            
            const updateButton = document.querySelector('.actualizar-horometro-btn');
            if (updateButton) {
                updateButton.addEventListener('click', () => {
                    modal.hide();
                    showActualizarHorometroModal(equipo);
                });
            }
            
            const editButton = document.querySelector('.editar-equipo-btn');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    modal.hide();
                    showEditarEquipoModal(equipo);
                });
            }
        }
        
    } catch (error) {
        console.error('Error showing equipo details:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los detalles. Por favor, intente nuevamente.
                <br><small>${error.message || 'Error desconocido'}</small>
            </div>
        `;
    }
}

// 5. Initialize dashboard with proper variables and error handling
// Global variables
let supabaseClient;
let currentUser;
let userRole = 'user';
let equiposData = [];
let currentSort = 'horometro-desc';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Show loading if you have a loading UI component
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) loadingElement.classList.remove('d-none');
        
        const isAuthenticated = await checkAuth();
        
        if (isAuthenticated) {
            // Load equipment data
            await loadEquipos();
            
            // Load clients data
            await loadClientes();
            
            // Set up search functionality
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    loadEquipos(searchInput.value);
                });
            }
            
            // Set up sorting functionality
            const sortHorometroBtn = document.getElementById('sort-horometro-btn');
            if (sortHorometroBtn) {
                sortHorometroBtn.addEventListener('click', () => {
                    const newSort = currentSort === 'horometro-desc' ? 'horometro-asc' : 'horometro-desc';
                    loadEquipos(searchInput?.value || '', newSort);
                });
            }
            
            const sortMarcaBtn = document.getElementById('sort-marca-btn');
            if (sortMarcaBtn) {
                sortMarcaBtn.addEventListener('click', () => {
                    const newSort = currentSort === 'marca-asc' ? 'marca-desc' : 'marca-asc';
                    loadEquipos(searchInput?.value || '', newSort);
                });
            }
            
            // Set up form submission handlers
            const mantForm = document.getElementById('registrarMantenimientoForm');
            if (mantForm) {
                mantForm.addEventListener('submit', registrarMantenimiento);
            }
            
            const horometroForm = document.getElementById('actualizarHorometroForm');
            if (horometroForm) {
                horometroForm.addEventListener('submit', actualizarHorometro);
            }
            
            const equipoForm = document.getElementById('editarEquipoForm');
            if (equipoForm) {
                equipoForm.addEventListener('submit', editarEquipo);
            }
            
            // Set up logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Show error message
        const container = document.getElementById('main-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger mt-4">
                    Error al inicializar el dashboard. Por favor, recargue la página o intente más tarde.
                    <br><small>${error.message || 'Error desconocido'}</small>
                </div>
            `;
        }
    } finally {
        // Hide loading indicator
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) loadingElement.classList.add('d-none');
    }
});

// Helper function to show toast notifications
function showToast(title, message, success = true) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast ${success ? 'bg-success' : 'bg-danger'} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-header ${success ? 'bg-success' : 'bg-danger'} text-white">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });
    
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}
