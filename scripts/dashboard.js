// scripts/dashboard.js

// Initialize Supabase client
const initializeSupabase = async () => {
    const { createClient } = supabase;
    const supabaseUrl = 'https://gztsbqbqmesfrvywpyhl.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI';
    return createClient(supabaseUrl, supabaseAnonKey);
};

// Global variables
let supabaseClient;
let currentUser;
let equiposData = [];
let mantenimientosData = [];
let currentSort = 'horometro-desc';
let userRole = 'cliente'; // Default role

// Toast notification system
function showToast(title, message, success = true) {
    const toastEl = document.getElementById('liveToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastTime = document.getElementById('toastTime');
    
    // Set toast content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastTime.textContent = new Date().toLocaleTimeString();
    
    // Set toast color based on success/error
    if (success) {
        toastEl.classList.remove('bg-danger', 'text-white');
        toastEl.querySelector('.toast-header').classList.remove('bg-danger', 'text-white');
    } else {
        toastEl.classList.add('bg-danger', 'text-white');
        toastEl.querySelector('.toast-header').classList.add('bg-danger', 'text-white');
    }
    
    // Show toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Authentication check
async function checkAuth() {
    try {
        supabaseClient = await initializeSupabase();
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Get current user data
        const { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        
        // Get user role from profiles table
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
            
        if (profileError) {
            console.error('Error fetching user role:', profileError);
        } else if (profileData) {
            userRole = profileData.role || 'cliente';
            
            // Update UI based on role
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            userRoleDisplay.textContent = `${user.email} (${userRole.charAt(0).toUpperCase() + userRole.slice(1)})`;
            
            // Show/hide admin sections
            if (userRole === 'admin') {
                document.getElementById('usuarios-nav-item').style.display = 'block';
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error checking authentication:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Load equipos data with filtering and sorting
async function loadEquipos(search = '', sort = currentSort) {
    try {
        currentSort = sort;
        const container = document.getElementById('generadores-container');
        container.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        
        // Build query
        let query = supabaseClient
            .from('equipos')
            .select(`
                id,
                marca_genset,
                serie_genset,
                modelo_genset,
                horometro,
                horas_equipo,
                potencia,
                fecha_ultimo_servicio,
                estado,
                clientes ( id, nombre )
            `);
            
        // Apply search filter if provided
        if (search) {
            query = query.or(`marca_genset.ilike.%${search}%,serie_genset.ilike.%${search}%,modelo_genset.ilike.%${search}%,clientes.nombre.ilike.%${search}%`);
        }
        
        // Apply sorting
        const [sortField, sortOrder] = sort.split('-');
        query = query.order(sortField === 'marca' ? 'marca_genset' : 'horometro', { ascending: sortOrder === 'asc' });
        
        const { data: equipos, error } = await query;
        
        if (error) {
            container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            return;
        }
        
        if (!equipos || equipos.length === 0) {
            container.innerHTML = `<div class="alert alert-info">No hay generadores registrados</div>`;
            return;
        }
        
        // Store data globally
        equiposData = equipos;
        
        // Calculate stats
        const totalEquipos = equipos.length;
        const operativos = equipos.filter(e => e.horas_equipo < 800).length;
        const alertas = equipos.filter(e => e.horas_equipo >= 800 && e.horas_equipo < 1000).length;
        const criticos = equipos.filter(e => e.horas_equipo >= 1000).length;
        
        // Update stat counters
        document.getElementById('total-equipos').textContent = totalEquipos;
        document.getElementById('equipos-operativos').textContent = operativos;
        document.getElementById('equipos-alerta').textContent = alertas;
        document.getElementById('equipos-criticos').textContent = criticos;
        
        // Render equipos list
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Serie</th>
                            <th>Cliente</th>
                            <th>Horómetro</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${equipos.map(equipo => `
                            <tr>
                                <td>${equipo.marca_genset}</td>
                                <td>${equipo.modelo_genset || 'N/A'}</td>
                                <td>${equipo.serie_genset}</td>
                                <td>${equipo.clientes?.nombre || 'Sin cliente'}</td>
                                <td>${equipo.horometro} hrs</td>
                                <td>
                                    <span class="badge ${getStatusBadgeClass(equipo.horas_equipo)}">
                                        ${getStatusText(equipo.horas_equipo)}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-primary ver-detalle-btn" data-id="${equipo.id}">
                                        <i class="fas fa-search"></i> Ver
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Add event listeners to detail buttons
        document.querySelectorAll('.ver-detalle-btn').forEach(btn => {
            btn.addEventListener('click', () => showEquipoDetalle(btn.getAttribute('data-id')));
        });
        
    } catch (error) {
        console.error('Error loading equipos:', error);
        document.getElementById('generadores-container').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los generadores. Por favor, intente nuevamente.
            </div>
        `;
    }
}

// Helper functions for equipment status
function getStatusBadgeClass(horas) {
    if (horas >= 1000) return 'bg-danger';
    if (horas >= 800) return 'bg-warning';
    return 'bg-success';
}

function getStatusText(horas) {
    if (horas >= 1000) return 'Mantenimiento urgente';
    if (horas >= 800) return 'Próximo a mantenimiento';
    return 'Operativo';
}

// Show equipment details modal
async function showEquipoDetalle(equipoId) {
    try {
        const modal = new bootstrap.Modal(document.getElementById('equipoDetalleModal'));
        const modalBody = document.getElementById('equipoDetalleBody');
        
        // Show loading state
        modalBody.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        modal.show();
        
        // Get equipo details
        const { data: equipo, error } = await supabaseClient
            .from('equipos')
            .select(`
                *,
                clientes ( * )
            `)
            .eq('id', equipoId)
            .single();
            
        if (error) {
            modalBody.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            return;
        }
        
        // Get maintenance history
        const { data: mantenimientos, error: mantError } = await supabaseClient
            .from('mantenimientos')
            .select('*')
            .eq('equipo_id', equipoId)
            .order('fecha', { ascending: false })
            .limit(5);
            
        if (mantError) {
            console
