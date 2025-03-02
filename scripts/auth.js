// Initialize Supabase and cache the client instance for reuse.
window.initializeSupabase = async () => {
    try {
        // Return cached client if it exists
        if (window._supabaseClient) {
            return window._supabaseClient;
        }
        
        // Ensure the Supabase library is available on the global window object.
        if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
            console.error('Supabase library not loaded properly');
            throw new Error('Error de conexión: Biblioteca Supabase no disponible');
        }
        
        // Supabase configuration
        const supabaseUrl = 'https://gztsbqbqmesfrvywpyhl.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI';
        
        // Create the Supabase client
        const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        
        // Test the connection by attempting to get the current session.
        const { error } = await client.auth.getSession();
        if (error) {
            throw error;
        }
        
        // Cache the initialized client for later use
        window._supabaseClient = client;
        return client;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        // If on the login page, show an alert to the user.
        if (window.location.pathname.includes('login.html')) {
            alert(`Error de conexión: ${error.message || 'No se pudo conectar a la base de datos'}`);
        }
        throw error;
    }
};

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Clear any existing error messages.
    let errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.textContent = '';
    }

    // Show loading state.
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';

    try {
        // Retrieve credentials.
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Initialize Supabase client.
        let client = await window.initializeSupabase();
        
        // Check for an existing session.
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData.session) {
            // Sign out the current session and clear the cached client.
            await client.auth.signOut();
            delete window._supabaseClient;
            // Reinitialize the client to get a fresh instance.
            client = await window.initializeSupabase();
        }
        
        // Attempt login with new credentials.
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            throw error;
        }
        
        console.log('Login successful!', data);
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'login-error';
            errorElement.className = 'alert alert-danger mt-3';
            loginForm.appendChild(errorElement);
        }
        errorElement.textContent = error.message || 'Error de inicio de sesión. Verifique sus credenciales.';
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});
