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

// Combined DOMContentLoaded event for login functionality and password recovery.
document.addEventListener('DOMContentLoaded', async () => {
    // -----------------------
    // Login Functionality
    // -----------------------
    try {
        // Initialize Supabase client
        const supabaseClient = await window.initializeSupabase();
        
        // Check if the user is already logged in.
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Set up login form submission if the form exists.
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // Clear any previous error message when a user focuses on an input field.
            const inputs = loginForm.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    const errorElement = document.getElementById('login-error');
                    if (errorElement) {
                        errorElement.textContent = '';
                    }
                });
            });
            
            // Handle the form submission.
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                // Clear any existing error message.
                let errorElement = document.getElementById('login-error');
                if (errorElement) {
                    errorElement.textContent = '';
                }
                
                // Show a loading state on the submit button.
                const submitButton = loginForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
                
                try {
                    // Retrieve user credentials.
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    
                    // Attempt login using Supabase authentication.
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) {
                        throw error;
                    }
                    
                    console.log('Login successful!', data);
                    // Redirect to dashboard after successful login.
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    console.error('Login error:', error);
                    
                    // Create or update the error message element.
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.id = 'login-error';
                        errorElement.className = 'alert alert-danger mt-3';
                        loginForm.appendChild(errorElement);
                    }
                    errorElement.textContent = error.message || 'Error de inicio de sesión. Verifique sus credenciales.';
                    
                    // Reset the submit button to its original state.
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                }
            });
        }
    } catch (error) {
        console.error('Authentication setup error:', error);
    }
    
    // -------------------------------
    // Password Recovery Functionality
    // -------------------------------
    const recoveryLink = document.querySelector('a[href="#recovery"]');
    if (recoveryLink) {
        recoveryLink.addEventListener('click', async (event) => {
            event.preventDefault();
            
            // Prompt the user for their email address.
            const email = prompt('Ingrese su correo electrónico para recuperar su contraseña:');
            if (!email) return;
            
            try {
                const supabaseClient = await window.initializeSupabase();
                // Send a password reset email with a redirect URL.
                const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password.html',
                });
                
                if (error) {
                    throw error;
                }
                
                alert('Si su correo está registrado, recibirá un enlace para restablecer su contraseña.');
            } catch (error) {
                console.error('Password recovery error:', error);
                alert(`Error: ${error.message || 'No se pudo procesar la solicitud.'}`);
            }
        });
    }
});
