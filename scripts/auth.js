import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gztsbqbqmesfrvywpyhl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI');

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // Autenticar al usuario
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error; // Lanza el error si la autenticación falla
    }

    // Verificar si el usuario está autenticado
    const user = data.user;
    if (!user) {
      throw new Error('No se pudo autenticar al usuario');
    }

    // Redirigir al dashboard
    window.location.href = 'dashboard.html';

  } 
    // Modificar el bloque catch
    catch (error) {
      console.error('Error en el login:', error);
      alert(error.message || 'Error de conexión');
      document.getElementById('password').value = '';
}
});

// Verificar sesión al cargar la página
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('Usuario autenticado:', session.user.email);
  } else {
    console.log('No hay sesión activa');
  }
});
