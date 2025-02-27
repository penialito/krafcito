const supabase = createClient('https://gztsbqbqmesfrvywpyhl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI');
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Verifica la sesión activa
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
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

// Verificador de sesión en tiempo real
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    window.location.href = 'dashboard.html';
  }
});
