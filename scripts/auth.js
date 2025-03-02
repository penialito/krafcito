// Fix Supabase initialization in auth.js

const initializeSupabase = async () => {
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
