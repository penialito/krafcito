// Initialize the Supabase client with your project URL and anon key
const supabase = createClient('https://gztsbqbqmesfrvywpyhl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI');
window.supabase = supabase;

// Event listener for the login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Attempt to sign in the user with the provided email and password
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error; // If there's an error during sign-in, throw it

        // Verify the active session
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            window.location.href = 'dashboard.html'; // Redirect to the dashboard upon successful login
        } else {
            throw new Error('Autenticación fallida'); // Throw an error if the user session is not found
        }

    } catch (error) {
        console.error('Error:', error); // Log the error to the console
        alert(error.message || 'Error desconocido'); // Display an alert to the user with the error message
        document.getElementById('password').value = ''; // Clear the password field
    }
});

// Real-time session checker
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
        window.location.href = 'dashboard.html'; // Redirect to dashboard if user signs in
    }
});
