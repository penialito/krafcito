// scripts/auth.js

const initializeSupabase = async () => {
    const { createClient } = supabase; // Import createClient
    const supabaseUrl = 'https://gztsbqbqmesfrvywpyhl.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI';
    return createClient(supabaseUrl, supabaseAnonKey);
};

const loginForm = document.getElementById('loginForm');

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = await initializeSupabase();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        // Check if the user is signed in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Redirect immediately after successful login
            window.location.href = 'dashboard.html';
        } else {
            throw new Error('Autenticación fallida');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error desconocido');
        document.getElementById('password').value = '';
    }
});
