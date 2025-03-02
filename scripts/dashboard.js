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
                else
