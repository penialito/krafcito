import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://TU_PROYECTO.supabase.co', 'TU_KEY_PUBLICA');

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

  } catch (error) {
    console.error('Error en el login:', error.message);
    alert('Credenciales incorrectas o error de conexión');
  }
});
