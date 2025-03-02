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
            document.querySelector('.registrar-mantenimiento-btn')?.addEventListener('click', () => {
                modal.hide();
                showRegistrarMantenimientoModal(equipo);
            });
            
            document.querySelector('.actualizar-horometro-btn')?.addEventListener('click', () => {
                modal.hide();
                showActualizarHorometroModal(equipo);
            });
            
            document.querySelector('.editar-equipo-btn')?.addEventListener('click', () => {
                modal.hide();
                showEditarEquipoModal(equipo);
            });
        }
        
    } catch (error) {
        console.error('Error showing equipo details:', error);
        document.getElementById('equipoDetalleBody').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los detalles. Por favor, intente nuevamente.
            </div>
        `;
    }
}

// Show modal to register maintenance
function showRegistrarMantenimientoModal(equipo) {
    const modal = new bootstrap.Modal(document.getElementById('registrarMantenimientoModal'));
    
    // Set form values
    document.getElementById('mantenimiento-equipo-id').value = equipo.id;
    document.getElementById('mantenimiento-equipo-info').textContent = `${equipo.marca_genset} - ${equipo.serie_genset}`;
    document.getElementById('mantenimiento-horometro').value = equipo.horometro;
    
    // Set current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('mantenimiento-fecha').value = today;
    
    // Show modal
    modal.show();
}

// Register new maintenance
async function registrarMantenimiento(event) {
    event.preventDefault();
    
    try {
        const equipoId = document.getElementById('mantenimiento-equipo-id').value;
        const fecha = document.getElementById('mantenimiento-fecha').value;
        const tipo = document.getElementById('mantenimiento-tipo').value;
        const horometro = document.getElementById('mantenimiento-horometro').value;
        const descripcion = document.getElementById('mantenimiento-descripcion').value;
        
        // Validation
        if (!fecha || !tipo || !horometro) {
            showToast('Error', 'Todos los campos son obligatorios', false);
            return;
        }
        
        // Insert maintenance record
        const { data, error } = await supabaseClient
            .from('mantenimientos')
            .insert([
                {
                    equipo_id: equipoId,
                    fecha,
                    tipo_mantenimiento: tipo,
                    horometro_al_realizar: horometro,
                    descripcion,
                    tecnico_id: currentUser.id
                }
            ]);
            
        if (error) {
            throw error;
        }
        
        // Update equipo's last service date
        const { error: updateError } = await supabaseClient
            .from('equipos')
            .update({
                fecha_ultimo_servicio: fecha,
                horas_equipo: 0 // Reset hours since last maintenance
            })
            .eq('id', equipoId);
            
        if (updateError) {
            console.error('Error updating equipo:', updateError);
        }
        
        // Hide modal and show success message
        const modal = bootstrap.Modal.getInstance(document.getElementById('registrarMantenimientoModal'));
        modal.hide();
        
        showToast('Éxito', 'Mantenimiento registrado correctamente');
        
        // Reload equipos
        loadEquipos();
        
    } catch (error) {
        console.error('Error registering maintenance:', error);
        showToast('Error', error.message || 'Error al registrar mantenimiento', false);
    }
}

// Show modal to update horometer
function showActualizarHorometroModal(equipo) {
    const modal = new bootstrap.Modal(document.getElementById('actualizarHorometroModal'));
    
    // Set form values
    document.getElementById('horometro-equipo-id').value = equipo.id;
    document.getElementById('horometro-equipo-info').textContent = `${equipo.marca_genset} - ${equipo.serie_genset}`;
    document.getElementById('horometro-actual').value = equipo.horometro;
    document.getElementById('horometro-nuevo').value = equipo.horometro;
    
    // Show modal
    modal.show();
}

// Update equipment horometer
async function actualizarHorometro(event) {
    event.preventDefault();
    
    try {
        const equipoId = document.getElementById('horometro-equipo-id').value;
        const horometroActual = parseInt(document.getElementById('horometro-actual').value);
        const horometroNuevo = parseInt(document.getElementById('horometro-nuevo').value);
        
        // Validation
        if (isNaN(horometroNuevo) || horometroNuevo < horometroActual) {
            showToast('Error', 'El horómetro nuevo debe ser mayor al actual', false);
            return;
        }
        
        // Update horometer
        const { error } = await supabaseClient
            .from('equipos')
            .update({
                horometro: horometroNuevo,
                horas_equipo: horometroNuevo - (horometroActual - equiposData.find(e => e.id === equipoId).horas_equipo)
            })
            .eq('id', equipoId);
            
        if (error) {
            throw error;
        }
        
        // Hide modal and show success message
        const modal = bootstrap.Modal.getInstance(document.getElementById('actualizarHorometroModal'));
        modal.hide();
        
        showToast('Éxito', 'Horómetro actualizado correctamente');
        
        // Reload equipos
        loadEquipos();
        
    } catch (error) {
        console.error('Error updating horometer:', error);
        showToast('Error', error.message || 'Error al actualizar horómetro', false);
    }
}

// Show modal to edit equipment
function showEditarEquipoModal(equipo) {
    const modal = new bootstrap.Modal(document.getElementById('editarEquipoModal'));
    
    // Set form values
    document.getElementById('editar-equipo-id').value = equipo.id;
    document.getElementById('editar-equipo-marca').value = equipo.marca_genset;
    document.getElementById('editar-equipo-modelo').value = equipo.modelo_genset || '';
    document.getElementById('editar-equipo-serie').value = equipo.serie_genset;
    document.getElementById('editar-equipo-potencia').value = equipo.potencia || '';
    document.getElementById('editar-equipo-cliente').value = equipo.clientes?.id || '';
    
    // Show modal
    modal.show();
}

// Edit equipment
async function editarEquipo(event) {
    event.preventDefault();
    
    try {
        const equipoId = document.getElementById('editar-equipo-id').value;
        const marca = document.getElementById('editar-equipo-marca').value;
        const modelo = document.getElementById('editar-equipo-modelo').value;
        const serie = document.getElementById('editar-equipo-serie').value;
        const potencia = document.getElementById('editar-equipo-potencia').value;
        const clienteId = document.getElementById('editar-equipo-cliente').value;
        
        // Validation
        if (!marca || !serie) {
            showToast('Error', 'Los campos Marca y Serie son obligatorios', false);
            return;
        }
        
        // Update equipment
        const { error } = await supabaseClient
            .from('equipos')
            .update({
                marca_genset: marca,
                modelo_genset: modelo,
                serie_genset: serie,
                potencia,
                cliente_id: clienteId
            })
            .eq('id', equipoId);
            
        if (error) {
            throw error;
        }
        
        // Hide modal and show success message
        const modal = bootstrap.Modal.getInstance(document.getElementById('editarEquipoModal'));
        modal.hide();
        
        showToast('Éxito', 'Equipo actualizado correctamente');
        
        // Reload equipos
        loadEquipos();
        
    } catch (error) {
        console.error('Error updating equipment:', error);
        showToast('Error', error.message || 'Error al actualizar equipo', false);
    }
}

// Load clients for dropdowns
async function loadClientes() {
    try {
        const { data: clientes, error } = await supabaseClient
            .from('clientes')
            .select('id, nombre')
            .order('nombre');
            
        if (error) {
            console.error('Error loading clients:', error);
            return;
        }
        
        // Populate client dropdowns
        const clienteSelects = document.querySelectorAll('.cliente-select');
        clienteSelects.forEach(select => {
            select.innerHTML = '<option value="">Seleccione un cliente</option>';
            clientes.forEach(cliente => {
                select.innerHTML += `<option value="${cliente.id}">${cliente.nombre}</option>`;
            });
        });
        
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

// Logout functionality
function logout() {
    supabaseClient.auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        // Load equipment data
        await loadEquipos();
        
        // Load clients data
        await loadClientes();
        
        // Set up search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', () => {
            loadEquipos(searchInput.value);
        });
        
        // Set up sorting functionality
        document.getElementById('sort-horometro-btn').addEventListener('click', () => {
            const newSort = currentSort === 'horometro-desc' ? 'horometro-asc' : 'horometro-desc';
            loadEquipos(searchInput.value, newSort);
        });
        
        document.getElementById('sort-marca-btn').addEventListener('click', () => {
            const newSort = currentSort === 'marca-asc' ? 'marca-desc' : 'marca-asc';
            loadEquipos(searchInput.value, newSort);
        });
        
        // Set up form submission handlers
        document.getElementById('registrarMantenimientoForm').addEventListener('submit', registrarMantenimiento);
        document.getElementById('actualizarHorometroForm').addEventListener('submit', actualizarHorometro);
        document.getElementById('editarEquipoForm').addEventListener('submit', editarEquipo);
        
        // Set up logout button
        document.getElementById('logout-btn').addEventListener('click', logout);
    }
});
