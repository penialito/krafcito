// Enhanced version of auth.js with proper initialization and login handling

// Make initializeSupabase available globally
window.initializeSupabase = async () => {
    try {
        // Check if supabase is available
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.error('Supabase library not loaded properly');
            throw new Error('Error de conexión: Biblioteca Supabase no disponible');
        }
        
        const supabaseUrl = 'https://gztsbqbqmesfrvywpyhl.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI';
        
        const client = supabase.createClient(supabaseUrl, supabaseAnonKey);
        
        // Test the connection
        const { error } = await client.auth.getSession();
        if (error) {
            throw error;
        }
        
        return client;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        // Show error alert if we're on the login page
        if (window.location.pathname.includes('login.html')) {
            alert(`Error de conexión: ${error.message || 'No se pudo conectar a la base de datos'}`);
        }
        throw error;
    }
};

// Handle login functionality
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Supabase
        const supabaseClient = await window.initializeSupabase();
        
        // Check if we're already logged in
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
            // Already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Set up login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                // Show loading state
                const submitButton = loginForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
                
                try {
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    
                    // Attempt login
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });
                    
                    if (error) {
                        throw error;
                    }
                    
                    // Successful login
                    console.log('Login successful!', data);
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    console.error('Login error:', error);
                    
                    // Create or update error message
                    let errorElement = document.getElementById('login-error');
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.id = 'login-error';
                        errorElement.className = 'alert alert-danger mt-3';
                        loginForm.appendChild(errorElement);
                    }
                    
                    errorElement.textContent = error.message || 'Error de inicio de sesión. Verifique sus credenciales.';
                    
                    // Reset button
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                }
            });
        }
    } catch (error) {
        console.error('Authentication setup error:', error);
    }
});

// Add password recovery functionality
document.addEventListener('DOMContentLoaded', () => {
    const recoveryLink = document.querySelector('a[href="#recovery"]');
    if (recoveryLink) {
        recoveryLink.addEventListener('click', async (event) => {
            event.preventDefault();
            
            const email = prompt('Ingrese su correo electrónico para recuperar su contraseña:');
            if (!email) return;
            
            try {
                const supabaseClient = await window.initializeSupabase();
                const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password.html',
                });
                
                if (error) {
                    throw error;
                }
                
                alert('Si su correo está registrado, recibirá un enlace para restablecer su contraseña.');
            } catch (error) {
                console.error('Password recovery error:', error);
                alert(`Error: ${error.message || 'No se pudo procesar la solicitud'}`);
            }
        });
    }
});
